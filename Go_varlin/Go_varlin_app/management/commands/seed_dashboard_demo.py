"""
Seeds enough demo data (Course, Enrollment, Modules/Lessons, Practice,
Assignments, Projects, Tests, Certificate, Job openings/Applications,
Community posts, Calendar events, Notifications, Profile, Settings) so a
given user can see every populated page under /dashboard/ instead of the
"you haven't enrolled yet" gate.

Usage:
    python manage.py seed_dashboard_demo <username>
    python manage.py seed_dashboard_demo <username> --reset   (wipe & reseed that user's demo rows)
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from Go_varlin_app.models import (
    Course, Enrollment, Module, Lesson,
    PracticeProblem, PracticeAttempt,
    Assignment, AssignmentSubmission,
    Project, TestAttempt, Certificate,
    JobOpening, Application, MockInterview,
    CommunityPost, CalendarEvent, Notification,
    Profile, UserSettings,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo LMS data for a user so /dashboard/ renders fully populated pages."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str)
        parser.add_argument(
            "--reset", action="store_true",
            help="Delete this user's existing enrollment/progress rows before reseeding.",
        )

    def handle(self, *args, **options):
        username = options["username"]
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(
                f"No user named '{username}'. Create the account (Sign Up / createsuperuser) first."
            )

        if options["reset"]:
            Enrollment.objects.filter(user=user).delete()
            PracticeAttempt.objects.filter(user=user).delete()
            AssignmentSubmission.objects.filter(user=user).delete()
            Project.objects.filter(user=user).delete()
            TestAttempt.objects.filter(user=user).delete()
            Certificate.objects.filter(user=user).delete()
            Application.objects.filter(user=user).delete()
            MockInterview.objects.filter(user=user).delete()
            CommunityPost.objects.filter(user=user).delete()
            CalendarEvent.objects.filter(user=user).delete()
            Notification.objects.filter(user=user).delete()

        now = timezone.now()
        today = now.date()

        # ---- Course + modules/lessons -----------------------------------
        course, _ = Course.objects.get_or_create(
            slug="full-stack-python",
            defaults=dict(
                name="Full Stack Python Development",
                category="Development",
                icon="🐍",
                mentor="Aditi Rao",
                duration="6 months",
                is_live_track=True,
            ),
        )

        module1, _ = Module.objects.get_or_create(course=course, order=1, defaults={"title": "Python Foundations"})
        module2, _ = Module.objects.get_or_create(course=course, order=2, defaults={"title": "Django & REST APIs"})

        lessons_data = [
            (module1, "python-basics", "Python Basics", "video", 1),
            (module1, "data-structures", "Data Structures", "video", 2),
            (module1, "python-quiz", "Foundations Quiz", "quiz", 3),
            (module2, "django-intro", "Intro to Django", "video", 1),
            (module2, "drf-apis", "Building REST APIs", "video", 2),
        ]
        for mod, slug, title, kind, order in lessons_data:
            Lesson.objects.get_or_create(
                module=mod, slug=slug,
                defaults=dict(title=title, kind=kind, duration_minutes=15, order=order),
            )

        # ---- Enrollment --------------------------------------------------
        enrollment, _ = Enrollment.objects.update_or_create(
            user=user, course=course,
            defaults=dict(progress_pct=42, last_lesson="Building REST APIs"),
        )

        # ---- Practice ------------------------------------------------------
        problems_data = [
            ("Two Sum", "Arrays", "easy", "coding", True),
            ("Reverse a Linked List", "Linked Lists", "medium", "coding", False),
            ("Django ORM basics", "Django", "easy", "mcq", False),
        ]
        for title, topic, diff, kind, daily in problems_data:
            problem, _ = PracticeProblem.objects.get_or_create(
                title=title, defaults=dict(topic=topic, difficulty=diff, kind=kind, is_daily_challenge=daily),
            )
            PracticeAttempt.objects.get_or_create(user=user, problem=problem, defaults={"solved": True})

        # ---- Assignments ---------------------------------------------------
        assignment, _ = Assignment.objects.get_or_create(
            course=course, title="Build a To-Do REST API",
            defaults={"due_date": today + timedelta(days=5)},
        )
        AssignmentSubmission.objects.get_or_create(
            assignment=assignment, user=user, defaults={"status": "pending"},
        )

        # ---- Projects ------------------------------------------------------
        Project.objects.get_or_create(
            user=user, title="Personal Portfolio Site",
            defaults=dict(course=course, kind="mini", github_url="https://github.com/example/portfolio", evaluated=False),
        )

        # ---- Tests ---------------------------------------------------------
        TestAttempt.objects.get_or_create(
            user=user, name="Python Fundamentals Mock Test",
            defaults=dict(kind="mock", score_pct=78, rank=42, taken_at=now - timedelta(days=2)),
        )

        # ---- Certificate (kept below 100% so "in progress" also shows) ----
        # Not issuing a certificate yet since progress is 42%.

        # ---- Placements ------------------------------------------------------
        job, _ = JobOpening.objects.get_or_create(
            company="Nimbus Tech", role="Junior Python Developer",
            defaults=dict(package="6-8 LPA", location="Bengaluru", status="open", min_attendance_pct=75),
        )
        job.eligible_courses.add(course)
        Application.objects.get_or_create(user=user, job=job, defaults={"status": "applied"})

        # ---- Community -------------------------------------------------------
        CommunityPost.objects.get_or_create(
            user=user, title="Stuck on Django migrations",
            defaults=dict(category="doubt", body="Getting an error running makemigrations, any tips?"),
        )

        # ---- Calendar --------------------------------------------------------
        CalendarEvent.objects.get_or_create(
            user=user, title="Live Class: Django REST Framework",
            defaults=dict(kind="live_class", starts_at=now + timedelta(days=1, hours=2)),
        )

        # ---- Notifications -----------------------------------------------------
        Notification.objects.get_or_create(
            user=user, message="Your assignment 'Build a To-Do REST API' is due in 5 days.",
            defaults={"category": "assignments"},
        )

        # ---- Profile / Settings ------------------------------------------------
        Profile.objects.get_or_create(
            user=user, defaults=dict(headline="Aspiring Full Stack Developer", skills="Python, Django, JavaScript"),
        )
        UserSettings.objects.get_or_create(user=user)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded demo dashboard data for '{username}'. Visit /dashboard/ while signed in as that user."
        ))
