from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas
from io import BytesIO
from flask import Response, jsonify
from .models import Attendance, Lecture


def create_pdf(lecture_id):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()
    header = Paragraph("Relatório de Presença", styles['Title'])
    elements.append(header)

    query = Attendance.query.join(Lecture)
    if lecture_id:
        lecture = Lecture.query.get(lecture_id)
        if lecture:
            query = query.filter(Lecture.id == lecture_id)
            filename = lecture.name
        else:
            return jsonify({'error': 'Lecture not found'}), 404

    records = query.order_by(Attendance.last_modified.desc()).all()
    data = [['Nome', 'CPF', 'Check-in', 'Check-out', 'Palestra']]
    for record in records:
        data.append([f"{record.first_name} {record.last_name}", f"{record.organization}", f"{record.check_in_time.strftime('%Y-%m-%d %H:%M') if record.check_in_time else 'N/A'}",
                    f"{record.check_out_time.strftime('%Y-%m-%d %H:%M') if record.check_out_time else 'N/A'}", f"{record.lecture.name}"])

    table = Table(data, colWidths=[doc.width/5.0]*5)
    table.setStyle(TableStyle([('INNERGRID', (0, 0), (-1, -1), 0.25, colors.black), ('BOX', (0, 0), (-1, -1),
                   0.25, colors.black), ('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return Response(buffer.getvalue(), mimetype='application/pdf', headers={'Content-Disposition': f'attachment;filename="{filename}.pdf"'})
