from flask import render_template, request, jsonify, Response, current_app as app
from . import db
from .models import Attendance, Lecture
from .utils import create_pdf
from datetime import datetime


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/lectures', methods=['GET'])
def get_lectures():
    lectures = Lecture.query.all()
    return jsonify([{'id': lecture.id, 'name': lecture.name, 'lecturer': lecture.lecturer, 'start_time': lecture.start_time, 'end_time': lecture.end_time} for lecture in lectures])


@app.route('/attendances', methods=['GET'])
def get_attendances():
    attendances = Attendance.query.all()
    return jsonify([{'id': attendance.id, 'first_name': attendance.first_name, 'last_name': attendance.last_name, 'organization': attendance.organization, 'check_in_time': attendance.check_in_time, 'check_out_time': attendance.check_out_time, 'lecture': attendance.lecture.name} for attendance in attendances])


@app.route('/register', methods=['POST'])
def register_attendance():
    data = request.json
    lecture = Lecture.query.get(data['lecture_id'])
    if not lecture:
        return jsonify({'error': 'Lecture not found'}), 404

    attendance = Attendance(first_name=data['first_name'], last_name=data['last_name'],
                            organization=data['organization'], check_in_time=datetime.utcnow(), lecture_id=data['lecture_id'])
    db.session.add(attendance)
    db.session.commit()
    return jsonify({'message': 'Attendance registered successfully'}), 201


@app.route('/download-pdf', methods=['GET'])
def download_pdf():
    lecture_id = request.args.get('lecture_id')
    return create_pdf(lecture_id)
