from flask import Blueprint, jsonify, request
from app.models import Lecture
from datetime import datetime
from app import db

lectures = Blueprint('lectures', __name__)


@lectures.route('/lectures', methods=['GET'])
def get_lectures():
    lectures = Lecture.query.all()
    return jsonify([{'id': lecture.id, 'name': lecture.name, 'lecturer': lecture.lecturer,
                     'start_time': lecture.start_time.strftime("%Y-%m-%d %H:%M"),
                     'end_time': lecture.end_time.strftime("%Y-%m-%d %H:%M")} for lecture in lectures])


@lectures.route('/register-lecture', methods=['POST'])
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


@lectures.route('/delete-lecture/<int:lecture_id>', methods=['POST'])
def delete_lecture(lecture_id):
    lecture = Lecture.query.get_or_404(lecture_id)
    db.session.delete(lecture)
    db.session.commit()
    return jsonify({'message': 'Palestra deletada com sucesso'})
