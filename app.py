from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
