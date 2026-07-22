"""
GO.VARLIN — LMS Dashboard
Models backing the student dashboard: enrollment gate, course progress,
practice/assignments/projects/tests, certificates, placements, community,
calendar and notifications.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid


# ----------------------------------------------------------------------
# Catalog / Enrollment
# ----------------------------------------------------------------------
class Course(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    icon = models.CharField(max_length=8, default="📘", help_text="Emoji or short glyph")
    mentor = models.CharField(max_length=120, blank=True)
    duration = models.CharField(max_length=40, blank=True)
    is_live_track = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress_pct = models.PositiveSmallIntegerField(default=0)
    last_lesson = models.CharField(max_length=160, blank=True)

    class Meta:
        unique_together = ("user", "course")

    def __str__(self):
        return f"{self.user} → {self.course}"


# ----------------------------------------------------------------------
# Course player: modules / lessons
# ----------------------------------------------------------------------
class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=160)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.slug} · {self.title}"


class Lesson(models.Model):
    KIND_CHOICES = [("video", "Video"), ("quiz", "Quiz"), ("assignment", "Assignment"), ("download", "Download")]
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    slug = models.SlugField()
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=12, choices=KIND_CHOICES, default="video")
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    video_url = models.URLField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class LessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "lesson")


# ----------------------------------------------------------------------
# Practice
# ----------------------------------------------------------------------
class PracticeProblem(models.Model):
    DIFFICULTY = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
    TYPE = [("coding", "Coding Problem"), ("mcq", "MCQ")]
    title = models.CharField(max_length=160)
    topic = models.CharField(max_length=80)
    difficulty = models.CharField(max_length=8, choices=DIFFICULTY)
    kind = models.CharField(max_length=8, choices=TYPE, default="coding")
    is_daily_challenge = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class PracticeAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    problem = models.ForeignKey(PracticeProblem, on_delete=models.CASCADE)
    solved = models.BooleanField(default=False)
    bookmarked = models.BooleanField(default=False)
    attempted_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "problem")


# ----------------------------------------------------------------------
# Assignments / Projects / Tests
# ----------------------------------------------------------------------
class Assignment(models.Model):
    STATUS = [("pending", "Pending"), ("submitted", "Submitted"), ("reviewed", "Reviewed")]
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    title = models.CharField(max_length=160)
    brief_pdf = models.FileField(upload_to="assignments/briefs/", blank=True, null=True)
    due_date = models.DateField()

    def __str__(self):
        return self.title


class AssignmentSubmission(models.Model):
    STATUS = Assignment.STATUS
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    file = models.FileField(upload_to="assignments/submissions/", blank=True, null=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("assignment", "user")


class Project(models.Model):
    KIND = [("mini", "Mini Project"), ("major", "Major Project"), ("industry", "Industry Project")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=10, choices=KIND, default="mini")
    github_url = models.URLField(blank=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    evaluated = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class TestAttempt(models.Model):
    TYPE = [("mock", "Mock Test"), ("coding", "Coding Test"), ("aptitude", "Aptitude"),
            ("technical", "Technical Quiz"), ("resume", "Resume Test"), ("interview", "Interview Test")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="test_attempts")
    name = models.CharField(max_length=160)
    kind = models.CharField(max_length=10, choices=TYPE)
    score_pct = models.PositiveSmallIntegerField(default=0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    taken_at = models.DateTimeField(default=timezone.now)


# ----------------------------------------------------------------------
# Certificates
# ----------------------------------------------------------------------
class Certificate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates")
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    issued_at = models.DateTimeField(auto_now_add=True)
    verify_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        unique_together = ("user", "course")


# ----------------------------------------------------------------------
# Placement Hub
# ----------------------------------------------------------------------
class JobOpening(models.Model):
    STATUS = [("open", "Open"), ("closed", "Closed")]
    company = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    package = models.CharField(max_length=40, blank=True)
    location = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=8, choices=STATUS, default="open")
    eligible_courses = models.ManyToManyField(Course, blank=True, related_name="job_openings")
    min_attendance_pct = models.PositiveSmallIntegerField(default=75)

    def __str__(self):
        return f"{self.company} — {self.role}"


class Application(models.Model):
    STATUS = [("applied", "Applied"), ("shortlisted", "Shortlisted"),
              ("interview", "Interview Scheduled"), ("offered", "Offer Extended"), ("rejected", "Rejected")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    job = models.ForeignKey(JobOpening, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=12, choices=STATUS, default="applied")
    applied_at = models.DateTimeField(auto_now_add=True)
    interview_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "job")


class MockInterview(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mock_interviews")
    track = models.CharField(max_length=80)
    scheduled_at = models.DateTimeField()
    feedback_score = models.PositiveSmallIntegerField(null=True, blank=True)


# ----------------------------------------------------------------------
# Community
# ----------------------------------------------------------------------
class CommunityPost(models.Model):
    CATEGORY = [("doubt", "Doubt"), ("announcement", "Announcement"),
                ("study_group", "Study Group"), ("mentor", "Mentor Post"), ("event", "Event")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_posts")
    category = models.CharField(max_length=14, choices=CATEGORY, default="doubt")
    title = models.CharField(max_length=160)
    body = models.TextField()
    likes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class CommunityComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# ----------------------------------------------------------------------
# Calendar / Notifications
# ----------------------------------------------------------------------
class CalendarEvent(models.Model):
    TYPE = [("live_class", "Live Class"), ("assignment_due", "Assignment Due"),
            ("test", "Test"), ("interview", "Interview"), ("event", "Event"), ("personal", "Personal")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="calendar_events")
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=16, choices=TYPE)
    starts_at = models.DateTimeField()

    class Meta:
        ordering = ["starts_at"]


class Notification(models.Model):
    CATEGORY = [("assignments", "Assignments"), ("placements", "Placements"),
                ("courses", "Courses"), ("system", "System Update")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    category = models.CharField(max_length=12, choices=CATEGORY, default="system")
    message = models.CharField(max_length=240)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


# ----------------------------------------------------------------------
# Profile / Settings
# ----------------------------------------------------------------------
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    photo = models.ImageField(upload_to="profile/photos/", blank=True, null=True)
    headline = models.CharField(max_length=160, blank=True)
    skills = models.CharField(max_length=300, blank=True, help_text="Comma separated")
    resume = models.FileField(upload_to="profile/resumes/", blank=True, null=True)
    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)

    def __str__(self):
        return f"Profile · {self.user}"


class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settings")
    dark_mode = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_alerts = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    language = models.CharField(max_length=20, default="English")
