from flask import Flask, render_template, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from pyzbar.pyzbar import decode
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import vobject
from PIL import Image
import cv2
import numpy as np
import base64
import io

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    organization = db.Column(db.String(100))
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow)
    lecture_id = db.Column(db.Integer, db.ForeignKey('lecture.id'))


class Lecture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    lecturer = db.Column(db.String(100))
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    attendees = db.relationship(
        'Attendance', backref='lecture', lazy='dynamic')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/lectures', methods=['GET'])
def get_lectures():
    lectures = Lecture.query.all()
    return jsonify([{'id': lecture.id, 'name': lecture.name, 'lecturer': lecture.lecturer,
                     'start_time': lecture.start_time.strftime("%Y-%m-%d %H:%M"),
                     'end_time': lecture.end_time.strftime("%Y-%m-%d %H:%M")} for lecture in lectures])


@app.route('/register-lecture', methods=['POST'])
def register_lecture():
    data = request.get_json()
    new_lecture = Lecture(
        name=data['name'],
        lecturer=data['lecturer'],
        start_time=datetime.strptime(data['start_time'], "%Y-%m-%dT%H:%M"),
        end_time=datetime.strptime(data['end_time'], "%Y-%m-%dT%H:%M")
    )
    db.session.add(new_lecture)
    db.session.commit()
    return jsonify({'message': 'Lecture registered successfully', 'id': new_lecture.id})


@app.route('/delete-lecture/<int:lecture_id>', methods=['POST'])
def delete_lecture(lecture_id):
    lecture = Lecture.query.get_or_404(lecture_id)
    db.session.delete(lecture)
    db.session.commit()
    return jsonify({'message': 'Lecture deleted successfully'})


@app.route('/scan', methods=['POST'])
def scan_qr():
    if 'file' not in request.files or request.files['file'].filename == '':
        return jsonify({'error': 'No selected file'}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    action = request.form['action']
    lecture_id = request.form['lecture_id']
    if not all([action, lecture_id]):
        return jsonify({'error': 'Missing form data'}), 400

    processed_image, image_for_display = preprocess_image(file)
    decoded_objects = decode(processed_image)

    if decoded_objects:
        vcard_string = decoded_objects[0].data.decode('utf-8', errors='ignore')
        contact_info = parse_vcard(vcard_string)

        buffered = io.BytesIO()
        image_for_display.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        attendance = Attendance.query.filter_by(
            organization=contact_info['Organization'], lecture_id=lecture_id).first()
        if not attendance:
            attendance = Attendance(
                first_name=contact_info['FirstName'],
                last_name=contact_info['LastName'],
                organization=contact_info['Organization'],
                lecture_id=lecture_id)
            db.session.add(attendance)

        if action == 'check-in':
            attendance.check_in_time = datetime.utcnow()
        elif action == 'check-out':
            attendance.check_out_time = datetime.utcnow()

        attendance.last_modified = datetime.utcnow()

        db.session.commit()
        return jsonify({'image': img_str, 'decoded_data': contact_info})
    return jsonify({'error': 'No QR code detected'}), 400


def preprocess_image(file_stream):
    file_stream.seek(0)
    file_bytes = np.asarray(bytearray(file_stream.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    contrast = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
    _, binary = cv2.threshold(
        contrast, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    final_image = Image.fromarray(binary)
    return final_image, final_image


def parse_vcard(vcard_string):
    try:
        vcard = vobject.readOne(vcard_string)
        name_components = vcard.n.value
        last_name = str(name_components.family)
        first_name = str(name_components.given)
        organization = str(
            vcard.org.value[0] if vcard.org and vcard.org.value else "Not available")

        contact_info = {
            'FirstName': first_name,
            'LastName': last_name,
            'Organization': organization
        }
        return contact_info
    except Exception as e:
        return {'error': str(e)}


@app.route('/history', methods=['GET'])
def get_history():
    lecture_id = request.args.get('lectureId')
    query = Attendance.query.join(Lecture).add_columns(
        Attendance.id, Attendance.first_name, Attendance.last_name,
        Attendance.organization, Attendance.check_in_time,
        Attendance.check_out_time, Lecture.name.label('lecture_name'),
        Attendance.last_modified
    )
    if lecture_id:
        query = query.filter(Lecture.id == lecture_id)
    records = query.order_by(Attendance.last_modified.desc()).all()
    return jsonify([{
        'id': record.id, 'first_name': record.first_name, 'last_name': record.last_name,
        'organization': record.organization, 'check_in_time': record.check_in_time.strftime("%Y-%m-%d %H:%M") if record.check_in_time else None,
        'check_out_time': record.check_out_time.strftime("%Y-%m-%d %H:%M") if record.check_out_time else None,
        'lecture_name': record.lecture_name
    } for record in records])


@app.route('/latest-history', methods=['GET'])
def get_latest_history():
    latest_record = Attendance.query.join(Lecture).add_columns(
        Attendance.first_name, Attendance.last_name,
        Attendance.organization, Attendance.check_in_time,
        Attendance.check_out_time, Lecture.name.label('lecture_name'),
        Attendance.last_modified
    ).order_by(Attendance.last_modified.desc()).first()  # Get the latest entry
    if latest_record:
        return jsonify({
            'first_name': latest_record.first_name,
            'last_name': latest_record.last_name,
            'organization': latest_record.organization,
            'check_in_time': latest_record.check_in_time.strftime("%Y-%m-%d %H:%M") if latest_record.check_in_time else None,
            'check_out_time': latest_record.check_out_time.strftime("%Y-%m-%d %H:%M") if latest_record.check_out_time else None,
            'lecture_name': latest_record.lecture_name
        })
    return jsonify({}), 404  # Return empty if no records found


@app.route('/delete-history/<int:history_id>', methods=['POST'])
def delete_history(history_id):
    attendance = Attendance.query.get_or_404(history_id)
    db.session.delete(attendance)
    db.session.commit()
    return jsonify({'message': 'Attendance deleted successfully'})


@app.route('/export-history', methods=['GET'])
def export_history():
    lecture_id = request.args.get('lectureId')
    buffer = io.BytesIO()

    # Default name for the PDF file
    filename = "All Lectures History"

    # Query setup
    query = Attendance.query.join(Lecture)
    if lecture_id:
        query = query.filter(Lecture.id == lecture_id)
        lecture = Lecture.query.get(lecture_id)
        if lecture:
            # Set filename to lecture name if found
            filename = f"{lecture.name} History"

    records = query.order_by(Attendance.last_modified.desc()).all()

    # Create PDF
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    x = 50
    y = height - 50
    p.drawString(x, y, "Attendance History")
    y -= 40

    # Add the header
    headers = ["Name", "Organization", "Check-in", "Check-out", "Lecture"]
    p.drawString(x, y, ' | '.join(headers))
    y -= 20

    # Add the rows
    for record in records:
        line = [
            f"{record.first_name} {record.last_name}",
            f"{record.organization}",
            f"{record.check_in_time.strftime('%Y-%m-%d %H:%M') if record.check_in_time else ''}",
            f"{record.check_out_time.strftime('%Y-%m-%d %H:%M') if record.check_out_time else ''}",
            f"{record.lecture.name}"
        ]
        p.drawString(x, y, ' | '.join(line))
        y -= 20
        if y < 50:
            p.showPage()
            y = height - 50

    p.save()

    # Move to the beginning of the StringIO buffer
    buffer.seek(0)
    return Response(buffer.getvalue(), mimetype='application/pdf', headers={'Content-Disposition': f'attachment;filename="{filename}.pdf"'})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
