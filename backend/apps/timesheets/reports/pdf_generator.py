import io
from datetime import date
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class WatermarkCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_watermark()
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_watermark(self):
        self.saveState()
        self.setFont("Helvetica-Bold", 68)
        self.setFillColor(colors.HexColor("#0F172A"), alpha=0.06)
        self.translate(A4[0] / 2.0, A4[1] / 2.0)
        self.rotate(45)
        self.drawCentredString(0, 0, "sysTrol")
        self.restoreState()

    def draw_footer(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(15 * mm, 10 * mm, "sysTrol ERP — Official Site Timesheet & Activity Diary")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(A4[0] - 15 * mm, 10 * mm, page_str)
        self.restoreState()


def generate_site_diary_pdf(
    *,
    timesheet=None,
    project=None,
    rows=None,
    week_days=None,
    policy=None,
    range_data=None,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2563EB"),
    )
    meta_label = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )
    meta_val = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor("#0F172A"),
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
    )
    table_cell_center = ParagraphStyle(
        "TableCellCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#1E293B"),
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#0F172A"),
    )
    sign_title = ParagraphStyle(
        "SignTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1E293B"),
    )
    sign_text = ParagraphStyle(
        "SignText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )

    story = []

    header_table = Table(
        [
            [
                Paragraph("sysTrol ERP", title_style),
                Paragraph("SITE ATTENDANCE & ACTIVITY DIARY", subtitle_style),
            ]
        ],
        colWidths=[80 * mm, 100 * mm],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 2 * mm))
    story.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=colors.HexColor("#2563EB"),
            spaceBefore=1,
            spaceAfter=4 * mm,
        )
    )

    if range_data:
        engineer = range_data["employee"]
        project = range_data["project"]
        policy = range_data["policy"]
        period_start = range_data["start_date"]
        period_end = range_data["end_date"]
        period_label = f"{period_start.strftime('%d/%m/%Y')} — {period_end.strftime('%d/%m/%Y')} ({range_data['total_days']} Days)"
        ref_num = f"SD-{project.code}-{period_start.strftime('%Y%m%d')}-{period_end.strftime('%Y%m%d')}-{engineer.employee_code}"
    else:
        engineer = timesheet.employee
        period_start = timesheet.week_start_date
        period_end = period_start + date.resolution * 6
        period_label = f"{period_start.strftime('%d/%m/%Y')} — {period_end.strftime('%d/%m/%Y')}"
        ref_num = f"SD-{project.code}-{period_start.strftime('%Y%m%d')}-{engineer.employee_code}"

    meta_left = [
        [Paragraph("Project Code:", meta_label), Paragraph(project.code, meta_val)],
        [Paragraph("Project Name:", meta_label), Paragraph(project.name, meta_val)],
        [Paragraph("Client Name:", meta_label), Paragraph(project.client_name or "-", meta_val)],
        [
            Paragraph("Site Location:", meta_label),
            Paragraph(
                f"{project.site_city_or_plant or '-'}, {project.site_country or 'India'}", meta_val
            ),
        ],
        [
            Paragraph("Site Timezone:", meta_label),
            Paragraph(project.site_timezone or "Asia/Kolkata", meta_val),
        ],
    ]

    meta_right = [
        [Paragraph("Site Engineer:", meta_label), Paragraph(engineer.full_name, meta_val)],
        [Paragraph("Employee Code:", meta_label), Paragraph(engineer.employee_code, meta_val)],
        [
            Paragraph("Designation:", meta_label),
            Paragraph(engineer.designation or "Site Engineer", meta_val),
        ],
        [
            Paragraph("Period:", meta_label),
            Paragraph(period_label, meta_val),
        ],
        [Paragraph("Document Ref:", meta_label), Paragraph(ref_num, meta_val)],
    ]

    left_tbl = Table(meta_left, colWidths=[24 * mm, 62 * mm])
    left_tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )

    right_tbl = Table(meta_right, colWidths=[26 * mm, 64 * mm])
    right_tbl.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )

    meta_wrapper = Table(
        [[left_tbl, right_tbl]],
        colWidths=[90 * mm, 90 * mm],
    )
    meta_wrapper.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    story.append(meta_wrapper)

    if range_data:
        metrics_table = Table(
            [
                [
                    Paragraph(f"<b>Duration:</b> {range_data['total_days']} Days", meta_val),
                    Paragraph(f"<b>Days Worked:</b> {range_data['days_worked']}", meta_val),
                    Paragraph(f"<b>Rest Days:</b> {range_data['rest_days_worked']}", meta_val),
                    Paragraph(
                        f"<b>Regular:</b> {range_data['total_regular_hours']:.2f}h", meta_val
                    ),
                    Paragraph(
                        f"<b>Overtime:</b> {range_data['total_overtime_hours']:.2f}h", meta_val
                    ),
                    Paragraph(f"<b>Total Hours:</b> {range_data['total_hours']:.2f}h", meta_val),
                ]
            ],
            colWidths=[30 * mm, 30 * mm, 30 * mm, 30 * mm, 30 * mm, 30 * mm],
        )
        metrics_table.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
                    ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2 * mm),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]
            )
        )
        story.append(Spacer(1, 2 * mm))
        story.append(metrics_table)

    story.append(Spacer(1, 5 * mm))

    table_data = [
        [
            Paragraph("Date", table_header),
            Paragraph("Day", table_header),
            Paragraph("Phase / Core Step", table_header),
            Paragraph("Activity Log & Work Description", table_header),
            Paragraph("Regular", table_header),
            Paragraph("Overtime", table_header),
            Paragraph("Total", table_header),
        ]
    ]

    current_step_name = "-"
    if hasattr(project, "steps"):
        for s in project.steps.all():
            if getattr(s, "status", "") in ("IN_PROGRESS", "INITIATED"):
                current_step_name = s.name
                break

    if range_data:
        total_reg = range_data["total_regular_hours"]
        total_ot = range_data["total_overtime_hours"]
        total_all = range_data["total_hours"]

        for d_item in range_data["days"]:
            d = d_item["date"]
            day_hours = d_item["hours"]
            reg = d_item["regular_hours"]
            ot = d_item["overtime_hours"]
            notes_combined = d_item["note"] or (
                "Site regular activities / standby" if day_hours > 0 else "-"
            )

            table_data.append(
                [
                    Paragraph(d.strftime("%d/%m/%Y"), table_cell_center),
                    Paragraph(d.strftime("%A"), table_cell_center),
                    Paragraph(current_step_name, table_cell_center),
                    Paragraph(notes_combined, table_cell),
                    Paragraph(f"{reg:.2f}", table_cell_center),
                    Paragraph(f"{ot:.2f}", table_cell_center),
                    Paragraph(f"{day_hours:.2f}", table_cell_bold),
                ]
            )
    else:
        total_reg = Decimal("0.00")
        total_ot = Decimal("0.00")
        total_all = Decimal("0.00")
        project_rows = [r for r in rows if r.project_id == project.id]

        for d in week_days:
            day_entries = [e for r in project_rows for e in r.entries.all() if e.date == d]
            day_hours = sum((e.hours for e in day_entries), Decimal("0.00"))

            if d.weekday() == 6:
                reg = Decimal("0.00")
                ot = day_hours
            else:
                reg = min(day_hours, policy.daily_regular_hours)
                ot = max(Decimal("0.00"), day_hours - policy.daily_regular_hours)

            total_reg += reg
            total_ot += ot
            total_all += day_hours

            notes_combined = " ".join(
                [e.note.strip() for e in day_entries if e.note and e.note.strip()]
            )
            if not notes_combined:
                notes_combined = "Site regular activities / standby" if day_hours > 0 else "-"

            table_data.append(
                [
                    Paragraph(d.strftime("%d/%m/%Y"), table_cell_center),
                    Paragraph(d.strftime("%A"), table_cell_center),
                    Paragraph(current_step_name, table_cell_center),
                    Paragraph(notes_combined, table_cell),
                    Paragraph(f"{reg:.2f}", table_cell_center),
                    Paragraph(f"{ot:.2f}", table_cell_center),
                    Paragraph(f"{day_hours:.2f}", table_cell_bold),
                ]
            )

    table_data.append(
        [
            Paragraph("TOTAL HOURS", table_cell_bold),
            Paragraph("", table_cell),
            Paragraph("", table_cell),
            Paragraph("", table_cell),
            Paragraph(f"{total_reg:.2f}", table_cell_bold),
            Paragraph(f"{total_ot:.2f}", table_cell_bold),
            Paragraph(f"{total_all:.2f}", table_cell_bold),
        ]
    )

    col_widths = [22 * mm, 22 * mm, 30 * mm, 60 * mm, 15 * mm, 15 * mm, 16 * mm]
    activity_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    activity_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
                ("SPAN", (0, -1), (3, -1)),
            ]
        )
    )
    story.append(activity_table)
    story.append(Spacer(1, 6 * mm))

    sign_left = [
        [Paragraph("Prepared & Certified by sysTrol Site Engineer", sign_title)],
        [Spacer(1, 2 * mm)],
        [Paragraph(f"Engineer Name: <b>{engineer.full_name}</b>", sign_text)],
        [Paragraph(f"Employee Code: <b>{engineer.employee_code}</b>", sign_text)],
        [Paragraph(f"Designation: <b>{engineer.designation or 'Site Engineer'}</b>", sign_text)],
        [Spacer(1, 8 * mm)],
        [Paragraph("Signature: ____________________________________", sign_text)],
        [Paragraph(f"Date: {date.today().strftime('%d/%m/%Y')}", sign_text)],
    ]

    sign_right = [
        [Paragraph("Verified & Approved by Client Site Representative", sign_title)],
        [Spacer(1, 2 * mm)],
        [Paragraph(f"Client Company: <b>{project.client_name or project.name}</b>", sign_text)],
        [Paragraph("Authorized Name: ____________________________", sign_text)],
        [Paragraph("Designation: ________________________________", sign_text)],
        [Spacer(1, 4 * mm)],
        [Paragraph("Signature: __________________  Date: ___________", sign_text)],
        [Spacer(1, 2 * mm)],
        [
            Table(
                [[Paragraph("OFFICIAL CLIENT STAMP HERE", sign_text)]],
                colWidths=[65 * mm],
                rowHeights=[14 * mm],
                style=[
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ],
            )
        ],
    ]

    tbl_sign_left = Table(sign_left, colWidths=[85 * mm])
    tbl_sign_right = Table(sign_right, colWidths=[85 * mm])

    dual_sign_table = Table(
        [[tbl_sign_left, tbl_sign_right]],
        colWidths=[90 * mm, 90 * mm],
    )
    dual_sign_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )

    story.append(KeepTogether(dual_sign_table))

    doc.build(story, canvasmaker=WatermarkCanvas)
    return buffer.getvalue()
