import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.core.timezone import company_today, week_bounds
from apps.projects.models import Project, ProjectAssignment, ProjectStep, StepStatus
from apps.projects.services import create_project, insert_sub_step
from apps.timesheets.models import (
    Timesheet,
    TimesheetEntry,
    TimesheetPolicy,
    TimesheetRow,
    TimesheetWeekStatus,
)


class Command(BaseCommand):
    help = "Seeds comprehensive demo data: 4 admins, 60 employees, 12 projects with steps, and 3 weeks of timesheets."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing demo entities before seeding.",
        )

    def handle(self, *args, **options):
        self.stdout.write("Starting demo data seeding...")

        TimesheetPolicy.get_current()

        if options.get("clear"):
            self.stdout.write("Clearing existing timesheets, projects, and users...")
            TimesheetEntry.objects.all().delete()
            TimesheetRow.objects.all().delete()
            Timesheet.objects.all().delete()
            ProjectAssignment.objects.all().delete()
            ProjectStep.objects.all().delete()
            Project.objects.all().delete()
            User.objects.all().delete()

        with transaction.atomic():
            admins = self._seed_admins()
            employees = self._seed_employees()
            projects = self._seed_projects(admins[0])
            self._seed_assignments(projects, employees, admins[0])
            self._seed_timesheets(employees, projects, admins)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded demo data: {len(admins)} admins, {len(employees)} employees, "
                f"{len(projects)} projects, assignments, and 3 weeks of timesheets."
            )
        )

    def _seed_admins(self) -> list[User]:
        admin_specs = [
            (
                "SYS-0001",
                "alice.henderson@systrol.local",
                "Alice Henderson",
                "Operations",
                "Operations Director",
            ),
            ("SYS-0002", "bob.vance@systrol.local", "Bob Vance", "Engineering", "Engineering VP"),
            (
                "SYS-0003",
                "charlie.patel@systrol.local",
                "Charlie Patel",
                "IT",
                "Chief Technology Officer",
            ),
            (
                "SYS-0004",
                "diana.prince@systrol.local",
                "Diana Prince",
                "Management",
                "General Manager",
            ),
        ]

        admins = []
        for code, email, name, dept, desig in admin_specs:
            user, created = User.objects.get_or_create(
                employee_code=code,
                defaults={
                    "email": email,
                    "full_name": name,
                    "department": dept,
                    "designation": desig,
                    "role": UserRole.ADMIN,
                    "is_active": True,
                    "must_change_password": False,
                },
            )
            if created or not user.check_password("DemoAdmin123!"):
                user.set_password("DemoAdmin123!")
                user.save(update_fields=["password"])
            admins.append(user)
        return admins

    def _seed_employees(self) -> list[User]:
        first_names = [
            "Aarav",
            "Vivaan",
            "Aditya",
            "Vihaan",
            "Arjun",
            "Sai",
            "Reyansh",
            "Ayaan",
            "Krishna",
            "Ishaan",
            "Shaurya",
            "Atharva",
            "Advik",
            "Pranav",
            "Advaith",
            "Aaryan",
            "Dhruv",
            "Kabir",
            "Ritvik",
            "Darsh",
            "Ananya",
            "Diya",
            "Gauri",
            "Kavya",
            "Isha",
            "Riya",
            "Aadhya",
            "Saanvi",
            "Pari",
            "Myra",
            "Anika",
            "Navya",
            "Angel",
            "Ira",
            "Prisha",
            "Tanvi",
            "Siya",
            "Aahana",
            "Tara",
            "Avani",
            "Rohan",
            "Siddharth",
            "Rahul",
            "Vikram",
            "Amit",
            "Naveen",
            "Deepak",
            "Manish",
            "Suresh",
            "Ramesh",
            "Pooja",
            "Neha",
            "Priya",
            "Sneha",
            "Shweta",
            "Anjali",
            "Swati",
            "Meera",
            "Sunita",
            "Rekha",
        ]
        last_names = [
            "Sharma",
            "Verma",
            "Gupta",
            "Malhotra",
            "Bhatia",
            "Saxena",
            "Mehta",
            "Chopra",
            "Joshi",
            "Patil",
            "Kulkarni",
            "Deshmukh",
            "Pawar",
            "Shinde",
            "More",
            "Iyer",
            "Nair",
            "Menon",
            "Pillai",
            "Reddy",
        ]
        departments = [
            (
                "Engineering",
                [
                    "Senior Design Engineer",
                    "Mechanical Engineer",
                    "CAD Designer",
                    "Structural Analyst",
                ],
            ),
            (
                "Manufacturing",
                ["Fabrication Lead", "Welding Specialist", "Assembly Technician", "CNC Operator"],
            ),
            (
                "Procurement",
                ["Supply Chain Specialist", "Vendor Coordinator", "Procurement Officer", "Buyer"],
            ),
            (
                "Quality",
                [
                    "QA Inspector",
                    "NDT Level II Specialist",
                    "Quality Control Lead",
                    "Audit Executive",
                ],
            ),
            (
                "Field Service",
                [
                    "Site Commissioning Engineer",
                    "Erection Supervisor",
                    "Safety Officer",
                    "Trial Engineer",
                ],
            ),
            (
                "Sales",
                [
                    "Technical Proposal Engineer",
                    "Sales Application Engineer",
                    "Estimator",
                    "Account Executive",
                ],
            ),
        ]

        employees = []
        for i in range(60):
            code = f"SYS-{i + 5:04d}"
            fn = first_names[i % len(first_names)]
            ln = last_names[(i * 3 + 7) % len(last_names)]
            full_name = f"{fn} {ln}"
            email = f"{fn.lower()}.{ln.lower()}.{i + 5}@systrol.local"

            dept_name, roles = departments[i % len(departments)]
            designation = roles[(i // 2) % len(roles)]

            user, created = User.objects.get_or_create(
                employee_code=code,
                defaults={
                    "email": email,
                    "full_name": full_name,
                    "department": dept_name,
                    "designation": designation,
                    "role": UserRole.EMPLOYEE,
                    "is_active": True,
                    "must_change_password": False,
                },
            )
            if created or not user.check_password("DemoUser123!"):
                user.set_password("DemoUser123!")
                user.save(update_fields=["password"])
            employees.append(user)
        return employees

    def _seed_projects(self, creator: User) -> list[Project]:
        project_catalog = [
            (
                "Flue Gas Desulfurization Unit",
                "Tata Steel Kalinganagar",
                "Turnkey FGD absorber scrubber train with lime preparation and dewatering systems.",
            ),
            (
                "Blast Furnace Gas Cleaning",
                "JSW Steel Vijayanagar",
                "High-efficiency cyclone separators, venturi scrubbers, and mist eliminator system.",
            ),
            (
                "Electrostatic Precipitator Retrofit",
                "L&T Heavy Hazira",
                "Rigid discharge electrode conversion and high-frequency transformer modernization.",
            ),
            (
                "Rotary Kiln Scrubber Package",
                "Adani Mundra Cement",
                "Venturi quenching tower and dual-alkali scrubbing column for sulfur emission reduction.",
            ),
            (
                "Waste Heat Recovery Dedusting",
                "BHEL Heavy Haridwar",
                "Baghouse filter unit with pulsed jet air cleaning and spark arrestor hopper.",
            ),
            (
                "Acid Gas Removal Train",
                "Vedanta Smelter Jharsuguda",
                "Caustic wash absorber with packed tower internals and continuous emission telemetry.",
            ),
            (
                "Raw Mill Pulse Jet Baghouse",
                "UltraTech Cement Kotputli",
                "Online pulse jet reverse-air fabric filter with PTFE membrane filter bags.",
            ),
            (
                "Coke Oven Gas Treatment Facility",
                "SAIL Steel Bokaro",
                "Electrostatic tar precipitator, ammonia saturator, and final cooler installation.",
            ),
            (
                "Tail Gas Thermal Oxidizer",
                "Reliance Refining Jamnagar",
                "High-temperature refractory combustion chamber with low-NOx burner package.",
            ),
            (
                "Fertilizer Granulation Vent Scrubber",
                "IFFCO Paradeep",
                "Counter-current tray tower for particulate collection and fluorides absorption.",
            ),
            (
                "Sinter Plant Exhaust dedusting",
                "RINL Steel Vizag",
                "Dry ESP system with micro-pulse power supplies and dust conveying chain conveyors.",
            ),
            (
                "Vent Gas Flare Scrubber Package",
                "GAIL Petrochemicals Pata",
                "Emergency knockout vessel and caustic wash quench column for hydrocarbon flaring.",
            ),
        ]

        projects = []
        for i, (name, client, desc) in enumerate(project_catalog):
            proj = Project.objects.filter(name=name).first()
            if not proj:
                proj = create_project(
                    name=name,
                    creator=creator,
                    client_name=client,
                    description=desc,
                )
            self._apply_project_progress(proj, i, creator)
            projects.append(proj)
        return projects

    def _apply_project_progress(self, project: Project, index: int, admin: User):
        steps = list(project.steps.order_by("position"))
        total = len(steps)

        if index in (0, 1):
            completed_count = total
            in_progress_count = 0
        elif index in (2, 3):
            completed_count = max(1, total - 2)
            in_progress_count = 1
        elif index in (4, 5, 6):
            completed_count = max(1, int(total * 0.6))
            in_progress_count = 1
            if not project.steps.filter(is_custom=True).exists():
                try:
                    ref_step = steps[5]
                    insert_sub_step(
                        project=project,
                        reference_step=ref_step,
                        name="Pre-commissioning Safety Clearance",
                        user=admin,
                    )
                except Exception:
                    pass
        elif index in (7, 8, 9):
            completed_count = max(1, int(total * 0.35))
            in_progress_count = 1
        else:
            completed_count = 1
            in_progress_count = 1

        steps = list(project.steps.order_by("position"))
        now = timezone.now()

        for idx, step in enumerate(steps):
            if idx < completed_count:
                step.status = StepStatus.COMPLETED
                step.confirmed_at = now - datetime.timedelta(days=total - idx)
                step.confirmed_by = admin
                step.confirmed_by_label = admin.full_name
                step.save()
            elif idx < completed_count + in_progress_count:
                step.status = StepStatus.IN_PROGRESS
                step.save()
            else:
                step.status = StepStatus.NOT_STARTED
                step.save()

    def _seed_assignments(self, projects: list[Project], employees: list[User], admin: User):
        for p_idx, project in enumerate(projects):
            team_size = 8 + (p_idx % 7)
            start_offset = (p_idx * 5) % len(employees)
            assigned_subset = [
                employees[(start_offset + k) % len(employees)] for k in range(team_size)
            ]

            for emp in assigned_subset:
                ProjectAssignment.objects.get_or_create(
                    project=project,
                    employee=emp,
                    defaults={
                        "assigned_by": admin,
                        "assigned_by_label": admin.full_name,
                        "assigned_at": timezone.now(),
                    },
                )

    def _seed_timesheets(self, employees: list[User], projects: list[Project], admins: list[User]):
        today = company_today()
        current_monday, _ = week_bounds(today)
        prev_monday = current_monday - datetime.timedelta(days=7)
        past_2_monday = current_monday - datetime.timedelta(days=14)

        weeks = [
            (past_2_monday, "APPROVED"),
            (prev_monday, "MIXED"),
            (current_monday, "OPEN"),
        ]

        admin_approver = admins[0]
        now = timezone.now()

        for emp_idx, emp in enumerate(employees):
            emp_assignments = list(
                ProjectAssignment.objects.filter(employee=emp).select_related("project")
            )
            if not emp_assignments:
                continue

            for week_monday, mode in weeks:
                if mode == "APPROVED":
                    status = TimesheetWeekStatus.APPROVED
                    submitted_at = now - datetime.timedelta(days=12)
                    approved_at = now - datetime.timedelta(days=11)
                    approved_by = admin_approver
                    approved_label = admin_approver.full_name
                    returned_at = None
                    returned_by = None
                    returned_label = ""
                    reason = ""
                elif mode == "OPEN":
                    status = TimesheetWeekStatus.OPEN
                    submitted_at = None
                    approved_at = None
                    approved_by = None
                    approved_label = ""
                    returned_at = None
                    returned_by = None
                    returned_label = ""
                    reason = ""
                else:
                    if emp_idx % 8 == 0:
                        status = TimesheetWeekStatus.RETURNED
                        submitted_at = now - datetime.timedelta(days=5)
                        approved_at = None
                        approved_by = None
                        approved_label = ""
                        returned_at = now - datetime.timedelta(days=4)
                        returned_by = admin_approver
                        returned_label = admin_approver.full_name
                        reason = "Please clarify task breakdown and hours on Thursday."
                    elif emp_idx % 5 == 0:
                        status = TimesheetWeekStatus.APPROVED
                        submitted_at = now - datetime.timedelta(days=5)
                        approved_at = now - datetime.timedelta(days=4)
                        approved_by = admin_approver
                        approved_label = admin_approver.full_name
                        returned_at = None
                        returned_by = None
                        returned_label = ""
                        reason = ""
                    else:
                        status = TimesheetWeekStatus.SUBMITTED
                        submitted_at = now - datetime.timedelta(days=3)
                        approved_at = None
                        approved_by = None
                        approved_label = ""
                        returned_at = None
                        returned_by = None
                        returned_label = ""
                        reason = ""

                ts, _ = Timesheet.objects.update_or_create(
                    employee=emp,
                    week_start_date=week_monday,
                    defaults={
                        "status": status,
                        "submitted_at": submitted_at,
                        "approved_at": approved_at,
                        "approved_by": approved_by,
                        "approved_by_label": approved_label,
                        "returned_at": returned_at,
                        "returned_by": returned_by,
                        "returned_by_label": returned_label,
                        "return_reason": reason,
                    },
                )

                selected_assignments = emp_assignments[: min(3, len(emp_assignments))]
                for assign_idx, assign in enumerate(selected_assignments):
                    row, _ = TimesheetRow.objects.get_or_create(
                        timesheet=ts,
                        project=assign.project,
                        defaults={
                            "description": f"Standard task allocation on {assign.project.code}",
                        },
                    )

                    for day_offset in range(5):
                        entry_date = week_monday + datetime.timedelta(days=day_offset)
                        if entry_date > today and status == TimesheetWeekStatus.OPEN:
                            continue

                        base_hours = (
                            Decimal("8.00") if len(selected_assignments) == 1 else Decimal("4.00")
                        )
                        if assign_idx == 0 and day_offset == 2 and (emp_idx % 3 == 0):
                            base_hours += Decimal("1.00")

                        TimesheetEntry.objects.update_or_create(
                            row=row,
                            date=entry_date,
                            defaults={
                                "hours": base_hours,
                                "note": f"Sprint milestone execution for {assign.project.name[:24]}",
                            },
                        )
