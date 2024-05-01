from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from pyzbar.pyzbar import decode
from PIL import Image
import io
import cv2
import numpy as np
import base64
import vobject
from datetime import datetime
import pytz

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
    lecture_id = db.Column(db.String(100))


class Lecture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    lecturer = db.Column(db.String(100))
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)


def convert_utc_to_edt(utc_dt):
    eastern = pytz.timezone('America/New_York')
    return utc_dt.replace(tzinfo=pytz.utc).astimezone(eastern)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/lectures', methods=['GET'])
def get_lectures():
    lectures = Lecture.query.all()
    lectures_data = [{
        'id': lecture.id,
        'name': lecture.name,
        'lecturer': lecture.lecturer,
        'start_time': lecture.start_time.isoformat() if lecture.start_time else None,
        'end_time': lecture.end_time.isoformat() if lecture.end_time else None
    } for lecture in lectures]
    return jsonify(lectures_data)


@app.route('/register_lecture', methods=['POST'])
def register_lecture():
    data = request.get_json()
    existing_lecture = Lecture.query.filter_by(name=data['name']).first()
    if existing_lecture:
        return jsonify({'error': 'Lecture already exists'}), 409

    new_lecture = Lecture(
        name=data['name'],
        lecturer=data['lecturer'],
        start_time=datetime.fromisoformat(data['start_time']),
        end_time=datetime.fromisoformat(data['end_time'])
    )
    db.session.add(new_lecture)
    db.session.commit()
    return jsonify({'id': new_lecture.id, 'name': new_lecture.name, 'lecturer': new_lecture.lecturer, 'start_time': new_lecture.start_time.isoformat(), 'end_time': new_lecture.end_time.isoformat()}), 201


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

        db.session.commit()
        return jsonify({'image': img_str, 'decoded_data': contact_info})
    return jsonify({'error': 'No QR code detected'}), 400


@app.route('/history', methods=['GET'])
def history():
    lecture_id = request.args.get('lecture_id', None)
    query = db.session.query(Attendance, Lecture.name).join(
        Lecture, Attendance.lecture_id == Lecture.id)
    if lecture_id:
        query = query.filter(Attendance.lecture_id == lecture_id)
    records = query.order_by(Attendance.check_in_time.desc()).all()

    return jsonify([{
        'first_name': record.Attendance.first_name,
        'last_name': record.Attendance.last_name,
        'organization': record.Attendance.organization,
        'check_in_time': convert_utc_to_edt(record.Attendance.check_in_time).isoformat() if record.Attendance.check_in_time else 'Not Checked In',
        'check_out_time': convert_utc_to_edt(record.Attendance.check_out_time).isoformat() if record.Attendance.check_out_time else 'Not Checked Out',
        'lecture_name': record.name
    } for record in records])


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


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
