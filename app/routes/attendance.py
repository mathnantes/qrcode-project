from flask import Blueprint, request, jsonify, Response
from app.models import Attendance, Lecture
from app import db
from datetime import datetime
from pyzbar.pyzbar import decode
from PIL import Image
import cv2
import numpy as np
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph

attendance = Blueprint('attendance', __name__)


@attendance.route('/scan', methods=['POST'])
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


@attendance.route('/history', methods=['GET'])
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


@attendance.route('/latest-history', methods=['GET'])
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


@attendance.route('/delete-history/<int:history_id>', methods=['POST'])
def delete_history(history_id):
    attendance = Attendance.query.get_or_404(history_id)
    db.session.delete(attendance)
    db.session.commit()
    return jsonify({'message': 'Registro deletado com sucesso'})


@attendance.route('/export-history', methods=['GET'])
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
