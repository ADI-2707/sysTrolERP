import io
from datetime import date
from decimal import Decimal

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side


def generate_site_diary_excel(
    *,
    timesheet,
    project,
    rows,
    week_days,
    policy,
) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Site Diary"

    ws.views.sheetView[0].showGridLines = True

    font_title = Font(name="Calibri", size=16, bold=True, color="0F172A")
    font_section = Font(name="Calibri", size=11, bold=True, color="1E293B")
    font_bold = Font(name="Calibri", size=10, bold=True, color="0F172A")
    font_regular = Font(name="Calibri", size=10, color="1E293B")
    font_meta_label = Font(name="Calibri", size=9, bold=True, color="475569")
    font_meta_val = Font(name="Calibri", size=9, color="0F172A")

    fill_title = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    fill_header = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
    fill_totals = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    fill_meta = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

    thin_border_side = Side(border_style="thin", color="CBD5E1")
    double_bottom_side = Side(border_style="double", color="64748B")
    box_border = Border(
        left=thin_border_side,
        right=thin_border_side,
        top=thin_border_side,
        bottom=thin_border_side,
    )
    totals_border = Border(
        left=thin_border_side,
        right=thin_border_side,
        top=thin_border_side,
        bottom=double_bottom_side,
    )

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_wrap_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center")

    ws.merge_cells("A1:G1")
    cell_a1 = ws["A1"]
    cell_a1.value = "sysTrol ERP — SITE ATTENDANCE & ACTIVITY DIARY"
    cell_a1.font = font_title
    cell_a1.fill = fill_title
    cell_a1.alignment = align_center
    ws.row_dimensions[1].height = 30

    engineer = timesheet.employee
    week_start = timesheet.week_start_date
    week_end = week_start + date.resolution * 6
    ref_num = f"SD-{project.code}-{week_start.strftime('%Y%m%d')}-{engineer.employee_code}"

    meta_rows = [
        ("Project Code:", project.code, "Site Engineer:", engineer.full_name),
        ("Project Name:", project.name, "Employee Code:", engineer.employee_code),
        (
            "Client Name:",
            project.client_name or "-",
            "Designation:",
            engineer.designation or "Site Engineer",
        ),
        (
            "Site Location:",
            f"{project.site_city_or_plant or '-'}, {project.site_country or 'India'}",
            "Period:",
            f"{week_start.strftime('%d/%m/%Y')} — {week_end.strftime('%d/%m/%Y')}",
        ),
        ("Site Timezone:", project.site_timezone or "Asia/Kolkata", "Document Ref:", ref_num),
    ]

    for idx, (lbl1, val1, lbl2, val2) in enumerate(meta_rows, start=3):
        ws.row_dimensions[idx].height = 18

        ws.cell(row=idx, column=1, value=lbl1).font = font_meta_label
        ws.cell(row=idx, column=1).fill = fill_meta
        ws.cell(row=idx, column=1).alignment = align_left

        ws.merge_cells(start_row=idx, start_column=2, end_row=idx, end_column=3)
        c_val1 = ws.cell(row=idx, column=2, value=val1)
        c_val1.font = font_meta_val
        c_val1.fill = fill_meta
        c_val1.alignment = align_left

        ws.cell(row=idx, column=4, value=lbl2).font = font_meta_label
        ws.cell(row=idx, column=4).fill = fill_meta
        ws.cell(row=idx, column=4).alignment = align_left

        ws.merge_cells(start_row=idx, start_column=5, end_row=idx, end_column=7)
        c_val2 = ws.cell(row=idx, column=5, value=val2)
        c_val2.font = font_meta_val
        c_val2.fill = fill_meta
        c_val2.alignment = align_left

        for col in range(1, 8):
            ws.cell(row=idx, column=col).border = box_border

    headers = [
        "Date",
        "Day of Week",
        "Phase / Core Step",
        "Activity Log & Work Description",
        "Regular Hours",
        "Overtime Hours",
        "Total Hours",
    ]
    header_row_idx = 9
    ws.row_dimensions[header_row_idx].height = 24

    for col_idx, h_text in enumerate(headers, start=1):
        cell = ws.cell(row=header_row_idx, column=col_idx, value=h_text)
        cell.font = font_bold
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = box_border

    project_rows = [r for r in rows if r.project_id == project.id]
    current_step_name = "-"
    if hasattr(project, "steps"):
        for s in project.steps.all():
            if getattr(s, "status", "") in ("IN_PROGRESS", "INITIATED"):
                current_step_name = s.name
                break

    start_data_row = 10
    for idx, d in enumerate(week_days):
        current_row = start_data_row + idx
        ws.row_dimensions[current_row].height = 26

        day_entries = [e for r in project_rows for e in r.entries.all() if e.date == d]
        day_hours = sum((e.hours for e in day_entries), Decimal("0.00"))

        if d.weekday() == 6:
            reg = Decimal("0.00")
            ot = day_hours
        else:
            reg = min(day_hours, policy.daily_regular_hours)
            ot = max(Decimal("0.00"), day_hours - policy.daily_regular_hours)

        notes_combined = " ".join(
            [e.note.strip() for e in day_entries if e.note and e.note.strip()]
        )
        if not notes_combined:
            notes_combined = "Site regular activities / standby" if day_hours > 0 else "-"

        c_date = ws.cell(row=current_row, column=1, value=d.strftime("%d/%m/%Y"))
        c_date.alignment = align_center
        c_date.font = font_regular
        c_date.border = box_border

        c_day = ws.cell(row=current_row, column=2, value=d.strftime("%A"))
        c_day.alignment = align_center
        c_day.font = font_regular
        c_day.border = box_border

        c_step = ws.cell(row=current_row, column=3, value=current_step_name)
        c_step.alignment = align_center
        c_step.font = font_regular
        c_step.border = box_border

        c_notes = ws.cell(row=current_row, column=4, value=notes_combined)
        c_notes.alignment = align_wrap_left
        c_notes.font = font_regular
        c_notes.border = box_border

        c_reg = ws.cell(row=current_row, column=5, value=float(reg))
        c_reg.alignment = align_right
        c_reg.font = font_regular
        c_reg.number_format = "0.00"
        c_reg.border = box_border

        c_ot = ws.cell(row=current_row, column=6, value=float(ot))
        c_ot.alignment = align_right
        c_ot.font = font_regular
        c_ot.number_format = "0.00"
        c_ot.border = box_border

        c_tot = ws.cell(row=current_row, column=7, value=f"=E{current_row}+F{current_row}")
        c_tot.alignment = align_right
        c_tot.font = font_bold
        c_tot.number_format = "0.00"
        c_tot.border = box_border

    end_data_row = start_data_row + len(week_days) - 1
    totals_row = end_data_row + 1
    ws.row_dimensions[totals_row].height = 22

    ws.merge_cells(f"A{totals_row}:D{totals_row}")
    c_tot_lbl = ws.cell(row=totals_row, column=1, value="TOTAL WEEK HOURS")
    c_tot_lbl.font = font_bold
    c_tot_lbl.fill = fill_totals
    c_tot_lbl.alignment = align_center

    for col in range(1, 5):
        ws.cell(row=totals_row, column=col).border = totals_border
        ws.cell(row=totals_row, column=col).fill = fill_totals

    c_tot_reg = ws.cell(row=totals_row, column=5, value=f"=SUM(E{start_data_row}:E{end_data_row})")
    c_tot_reg.font = font_bold
    c_tot_reg.fill = fill_totals
    c_tot_reg.alignment = align_right
    c_tot_reg.number_format = "0.00"
    c_tot_reg.border = totals_border

    c_tot_ot = ws.cell(row=totals_row, column=6, value=f"=SUM(F{start_data_row}:F{end_data_row})")
    c_tot_ot.font = font_bold
    c_tot_ot.fill = fill_totals
    c_tot_ot.alignment = align_right
    c_tot_ot.number_format = "0.00"
    c_tot_ot.border = totals_border

    c_tot_all = ws.cell(row=totals_row, column=7, value=f"=SUM(G{start_data_row}:G{end_data_row})")
    c_tot_all.font = font_bold
    c_tot_all.fill = fill_totals
    c_tot_all.alignment = align_right
    c_tot_all.number_format = "0.00"
    c_tot_all.border = totals_border

    sign_start_row = totals_row + 3

    ws.merge_cells(f"A{sign_start_row}:C{sign_start_row}")
    s_l_title = ws.cell(
        row=sign_start_row, column=1, value="Prepared & Certified by sysTrol Site Engineer"
    )
    s_l_title.font = font_section

    ws.merge_cells(f"D{sign_start_row}:G{sign_start_row}")
    s_r_title = ws.cell(
        row=sign_start_row, column=4, value="Verified & Approved by Client Representative"
    )
    s_r_title.font = font_section

    ws.cell(
        row=sign_start_row + 1, column=1, value=f"Engineer Name: {engineer.full_name}"
    ).font = font_regular
    ws.cell(
        row=sign_start_row + 1,
        column=4,
        value=f"Client Company: {project.client_name or project.name}",
    ).font = font_regular

    ws.cell(
        row=sign_start_row + 2, column=1, value=f"Employee Code: {engineer.employee_code}"
    ).font = font_regular
    ws.cell(
        row=sign_start_row + 2, column=4, value="Authorized Signatory Name: _______________________"
    ).font = font_regular

    ws.cell(
        row=sign_start_row + 3,
        column=1,
        value=f"Designation: {engineer.designation or 'Site Engineer'}",
    ).font = font_regular
    ws.cell(
        row=sign_start_row + 3, column=4, value="Designation: _____________________________________"
    ).font = font_regular

    ws.cell(
        row=sign_start_row + 5, column=1, value="Signature: ____________________________________"
    ).font = font_regular
    ws.cell(
        row=sign_start_row + 5, column=4, value="Signature & Date: ________________________________"
    ).font = font_regular

    ws.cell(
        row=sign_start_row + 6, column=1, value=f"Date: {date.today().strftime('%d/%m/%Y')}"
    ).font = font_regular
    ws.cell(
        row=sign_start_row + 6,
        column=4,
        value="Official Client Stamp: [                                          ]",
    ).font = font_regular

    col_widths = {
        "A": 14,
        "B": 14,
        "C": 24,
        "D": 45,
        "E": 14,
        "F": 14,
        "G": 16,
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
