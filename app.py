from flask import Flask, render_template, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
from pyzbar.pyzbar import decode
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from PIL import Image
import cv2
import numpy as np
import io
import os

app = Flask(__name__)
uri = os.getenv('DATABASE_URL')
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = uri
db = SQLAlchemy(app)
migrate = Migrate(app, db)


class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    qr_code_data = db.Column(db.String(3))
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
    return jsonify({'message': 'Palestra registrada com sucesso', 'id': new_lecture.id})


@app.route('/delete-lecture/<int:lecture_id>', methods=['POST'])
def delete_lecture(lecture_id):
    lecture = Lecture.query.get_or_404(lecture_id)
    db.session.delete(lecture)
    db.session.commit()
    return jsonify({'message': 'Palestra deletada com sucesso'})


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
        qr_code_data = decoded_objects[0].data.decode('utf-8', errors='ignore')

        if not qr_code_data.isdigit() or int(qr_code_data) not in range(1, 251):
            return jsonify({'error': 'Invalid QR code data'}), 400

        attendance = Attendance.query.filter_by(
            qr_code_data=qr_code_data, lecture_id=lecture_id).first()
        if not attendance:
            attendance = Attendance(
                qr_code_data=qr_code_data,
                lecture_id=lecture_id)
            db.session.add(attendance)

        if action == 'check-in':
            attendance.check_in_time = datetime.utcnow()
        elif action == 'check-out':
            attendance.check_out_time = datetime.utcnow()

        attendance.last_modified = datetime.utcnow()

        db.session.commit()
        return jsonify({'decoded_data': qr_code_data})
    return jsonify({'error': 'Nenhum QR Code detectado!'}), 400


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


@app.route('/history', methods=['GET'])
def get_history():
    lecture_id = request.args.get('lectureId')
    query = Attendance.query.join(Lecture).add_columns(
        Attendance.id, Attendance.qr_code_data,
        Attendance.check_in_time, Attendance.check_out_time, Lecture.name.label(
            'lecture_name'),
        Attendance.last_modified
    )
    if lecture_id:
        query = query.filter(Lecture.id == lecture_id)
    records = query.order_by(Attendance.last_modified.desc()).all()
    return jsonify([{
        'id': record.id, 'qr_code_data': record.qr_code_data,
        'check_in_time': record.check_in_time.strftime("%Y-%m-%d %H:%M") if record.check_in_time else None,
        'check_out_time': record.check_out_time.strftime("%Y-%m-%d %H:%M") if record.check_out_time else None,
        'lecture_name': record.lecture_name
    } for record in records])


@app.route('/latest-history', methods=['GET'])
def get_latest_history():
    latest_record = Attendance.query.join(Lecture).add_columns(
        Attendance.qr_code_data,
        Attendance.check_in_time, Attendance.check_out_time, Lecture.name.label(
            'lecture_name'),
        Attendance.last_modified
    ).order_by(Attendance.last_modified.desc()).first()  # Get the latest entry
    if latest_record:
        return jsonify({
            'qr_code_data': latest_record.qr_code_data,
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
    return jsonify({'message': 'Registro deletado com sucesso'})


@app.route('/export-history', methods=['GET'])
def export_history():
    lecture_id = request.args.get('lectureId')
    filename = "All_Lectures_History.pdf" if not lecture_id else "Filtered_History.pdf"
    buffer = io.BytesIO()

    # Setting up the document with buffer and page size
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72,
                            leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    flowables = []

    # Heading
    header = Paragraph(f'Attendance History - {filename}', styles['Heading1'])
    flowables.append(header)

    # Fetch data
    query = Attendance.query.join(Lecture)
    if lecture_id:
        lecture = Lecture.query.get(lecture_id)
        if lecture:
            query = query.filter(Lecture.id == lecture_id)
            # Update filename if lecture is found
            filename = lecture.name.replace(" ", "_") + "_History.pdf"
        else:
            return jsonify({'error': 'Lecture not found'}), 404

    records = query.order_by(Attendance.last_modified.desc()).all()

    # Prepare data for the table
    data = [['ID', 'Check-in', 'Check-out', 'Palestra']]
    for record in records:
        data.append([
            f"{record.qr_code_data}",
            f"{record.check_in_time.strftime('%Y-%m-%d %H:%M') if record.check_in_time else 'N/A'}",
            f"{record.check_out_time.strftime('%Y-%m-%d %H:%M') if record.check_out_time else 'N/A'}",
            f"{record.lecture.name}"
        ])

    # Table style
    table = Table(data, colWidths=[doc.width / 4.0] * 4)
    table.setStyle(TableStyle([
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.black),
        ('BOX', (0, 0), (-1, -1), 0.25, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER')
    ]))
    flowables.append(table)

    # Build the document
    doc.build(flowables)

    # Prepare response
    buffer.seek(0)
    return Response(buffer.getvalue(), mimetype='application/pdf', headers={
        'Content-Disposition': f'attachment; filename="{filename}"'
    })


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
