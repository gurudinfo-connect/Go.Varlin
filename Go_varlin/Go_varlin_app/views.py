from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Avg, Q

from .decorators import enrollment_required
from .models import (
    Course, Enrollment, Module, Lesson, LessonProgress,
    PracticeProblem, PracticeAttempt, Assignment, AssignmentSubmission,
    Project, TestAttempt, Certificate, JobOpening, Application,
    MockInterview, CommunityPost, CalendarEvent, Notification,
    Profile, UserSettings,
)


# ========================================================================
# Public site views (welcome, auth, marketing pages)
# ========================================================================

def welcome(request):
    return render(request, "welcome.html")


def signup(request):

    if request.method == "POST":

        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return redirect("signup")

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        messages.success(request, "Account Created Successfully")
        return redirect("signin")

    return render(request, "signup.html")


def signin(request):

    if request.method == "POST":

        email = request.POST.get("username")
        password = request.POST.get("password")

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, "Email not registered.")
            return render(request, "signin.html")

        user = authenticate(
            request,
            username=user_obj.username,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect("index")

        messages.error(request, "Invalid password.")

    return render(request, "signin.html")


def legacy_dashboard(request):
    """The original single-page, localStorage-driven dashboard.html.
    Kept only for reference — the live dashboard is now the multi-page
    LMS section further down this file, mounted at /dashboard/."""

    if request.user.is_authenticated:

        return render(request, "dashboard.html")

    return redirect("signin")


def logout_user(request):

    logout(request)

    return redirect("welcome")


def contact(request):
    return render(request, "contact.html")


def hire_connect(request):
    return render(request, "hire-connect.html")


def course_details(request):
    return render(request, "course-details.html")


def index(request):
    return render(request, "index.html")


# ========================================================================
# LMS Dashboard views (multi-page student dashboard)
# ========================================================================

def _sidebar_ctx(request, active):
    """Shared context every dashboard template needs for the fixed sidebar
    + top navigation (unread counts, active course switcher, breadcrumb)."""
    enrollments = Enrollment.objects.filter(user=request.user).select_related("course")
    return {
        "active_page": active,
        "enrollments": enrollments,
        "unread_notifications": Notification.objects.filter(user=request.user, is_read=False).count(),
        "current_course": enrollments.first().course if enrollments.exists() else None,
    }


@enrollment_required
def dashboard_home(request):
    ctx = _sidebar_ctx(request, "dashboard")
    enrollments = ctx["enrollments"]
    ctx.update({
        "overall_progress": round(enrollments.aggregate(a=Avg("progress_pct"))["a"] or 0),
        "continue_learning": enrollments.order_by("-enrolled_at")[:3],
        "upcoming_classes": CalendarEvent.objects.filter(user=request.user, kind="live_class",
                                                           starts_at__gte=timezone.now()).order_by("starts_at")[:4],
        "assignments_due": Assignment.objects.filter(course__enrollments__user=request.user,
                                                       due_date__gte=timezone.now().date()).order_by("due_date")[:4],
        "practice_daily": PracticeProblem.objects.filter(is_daily_challenge=True)[:4],
        "recent_certs": Certificate.objects.filter(user=request.user).order_by("-issued_at")[:3],
        "announcements": CommunityPost.objects.filter(category="announcement").order_by("-created_at")[:4],
        "placement_updates": CommunityPost.objects.filter(category="event").order_by("-created_at")[:3],
        "today_events": CalendarEvent.objects.filter(user=request.user, starts_at__date=timezone.now().date()),
    })
    return render(request, "dashboard/dashboard.html", ctx)


@login_required(login_url="signin")
def no_enrollment(request):
    return render(request, "dashboard/no_enrollment.html")


@enrollment_required
def my_learning(request):
    ctx = _sidebar_ctx(request, "my-learning")
    enrollments = ctx["enrollments"]
    ctx.update({
        "recently_viewed": enrollments.order_by("-enrolled_at")[:4],
        "completed": enrollments.filter(progress_pct=100),
        "avg_progress": round(enrollments.aggregate(a=Avg("progress_pct"))["a"] or 0),
    })
    return render(request, "dashboard/my_learning.html", ctx)


@enrollment_required
def course_player(request, course_slug, lesson_slug=None):
    course = get_object_or_404(Course, slug=course_slug, enrollments__user=request.user)
    modules = Module.objects.filter(course=course).prefetch_related("lessons")
    all_lessons = list(Lesson.objects.filter(module__course=course).order_by("module__order", "order"))
    lesson = None
    if lesson_slug:
        lesson = next((l for l in all_lessons if l.slug == lesson_slug), None)
    lesson = lesson or (all_lessons[0] if all_lessons else None)

    idx = all_lessons.index(lesson) if lesson in all_lessons else -1
    prev_lesson = all_lessons[idx - 1] if idx > 0 else None
    next_lesson = all_lessons[idx + 1] if 0 <= idx < len(all_lessons) - 1 else None
    completed_ids = set(LessonProgress.objects.filter(user=request.user, completed=True)
                         .values_list("lesson_id", flat=True))

    ctx = _sidebar_ctx(request, "my-learning")
    ctx.update({
        "course": course, "modules": modules, "lesson": lesson,
        "prev_lesson": prev_lesson, "next_lesson": next_lesson,
        "completed_ids": completed_ids,
    })
    return render(request, "dashboard/course_player.html", ctx)


@enrollment_required
def practice(request):
    ctx = _sidebar_ctx(request, "practice")
    problems = PracticeProblem.objects.all()
    attempts = {a.problem_id: a for a in PracticeAttempt.objects.filter(user=request.user)}
    ctx.update({
        "problems": problems,
        "attempts": attempts,
        "daily_challenge": problems.filter(is_daily_challenge=True).first(),
        "topics": problems.values_list("topic", flat=True).distinct(),
    })
    return render(request, "dashboard/practice.html", ctx)


@enrollment_required
def assignments(request):
    ctx = _sidebar_ctx(request, "assignments")
    course_ids = ctx["enrollments"].values_list("course_id", flat=True)
    items = Assignment.objects.filter(course_id__in=course_ids).select_related("course")
    subs = {s.assignment_id: s for s in AssignmentSubmission.objects.filter(user=request.user)}
    ctx.update({"assignments": items, "submissions": subs})
    return render(request, "dashboard/assignments.html", ctx)


@enrollment_required
def projects(request):
    ctx = _sidebar_ctx(request, "projects")
    ctx["projects"] = Project.objects.filter(user=request.user).select_related("course")
    return render(request, "dashboard/projects.html", ctx)


@enrollment_required
def tests(request):
    ctx = _sidebar_ctx(request, "tests")
    ctx["attempts"] = TestAttempt.objects.filter(user=request.user).order_by("-taken_at")
    return render(request, "dashboard/tests.html", ctx)


@enrollment_required
def certificates(request):
    ctx = _sidebar_ctx(request, "certificates")
    ctx["certificates"] = Certificate.objects.filter(user=request.user).select_related("course")
    ctx["in_progress"] = ctx["enrollments"].exclude(progress_pct=100)
    return render(request, "dashboard/certificates.html", ctx)


@enrollment_required
def placements(request):
    ctx = _sidebar_ctx(request, "placements")
    course_ids = ctx["enrollments"].values_list("course_id", flat=True)
    openings = JobOpening.objects.filter(Q(eligible_courses__id__in=course_ids) | Q(eligible_courses__isnull=True)).distinct()
    applied_ids = set(Application.objects.filter(user=request.user).values_list("job_id", flat=True))
    ctx.update({
        "openings": openings,
        "applied_ids": applied_ids,
        "applications": Application.objects.filter(user=request.user).select_related("job"),
        "mock_interviews": MockInterview.objects.filter(user=request.user).order_by("scheduled_at"),
        "offers_count": Application.objects.filter(user=request.user, status="offered").count(),
    })
    return render(request, "dashboard/placements.html", ctx)


@enrollment_required
def community(request):
    ctx = _sidebar_ctx(request, "community")
    ctx["posts"] = CommunityPost.objects.select_related("user").order_by("-created_at")[:30]
    return render(request, "dashboard/community.html", ctx)


@enrollment_required
def calendar_view(request):
    ctx = _sidebar_ctx(request, "calendar")
    ctx["events"] = CalendarEvent.objects.filter(user=request.user)
    return render(request, "dashboard/calendar.html", ctx)


@enrollment_required
def notifications(request):
    ctx = _sidebar_ctx(request, "notifications")
    ctx["items"] = Notification.objects.filter(user=request.user)
    return render(request, "dashboard/notifications.html", ctx)


@enrollment_required
def profile(request):
    ctx = _sidebar_ctx(request, "profile")
    profile_obj, _ = Profile.objects.get_or_create(user=request.user)
    ctx["profile"] = profile_obj
    ctx["achievements"] = Certificate.objects.filter(user=request.user).count()
    return render(request, "dashboard/profile.html", ctx)


@enrollment_required
def settings_view(request):
    ctx = _sidebar_ctx(request, "settings")
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
    ctx["settings"] = settings_obj
    return render(request, "dashboard/settings.html", ctx)
