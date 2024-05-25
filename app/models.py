from . import db
from datetime import datetime


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
