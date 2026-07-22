from django.urls import path, include
from . import views

# ------------------------------------------------------------------
# LMS Dashboard routes — kept namespaced as "dashboard:" (e.g.
# {% url 'dashboard:home' %}) so the templates that came from
# govarlin-lms-dashboard.zip work unmodified, even though the code now
# lives directly inside Go_varlin_app instead of a separate app.
# ------------------------------------------------------------------
dashboard_urlpatterns = [
    path("", views.dashboard_home, name="home"),
    path("not-enrolled/", views.no_enrollment, name="no_enrollment"),

    path("my-learning/", views.my_learning, name="my_learning"),
    path("course-player/<slug:course_slug>/", views.course_player, name="course_player"),
    path("course-player/<slug:course_slug>/<slug:lesson_slug>/", views.course_player, name="course_player_lesson"),

    path("practice/", views.practice, name="practice"),
    path("assignments/", views.assignments, name="assignments"),
    path("projects/", views.projects, name="projects"),
    path("tests/", views.tests, name="tests"),
    path("certificates/", views.certificates, name="certificates"),
    path("placements/", views.placements, name="placements"),
    path("community/", views.community, name="community"),
    path("calendar/", views.calendar_view, name="calendar"),
    path("notifications/", views.notifications, name="notifications"),
    path("profile/", views.profile, name="profile"),
    path("settings/", views.settings_view, name="settings"),
]

urlpatterns = [
    path('', views.welcome, name='welcome'),
    path("accounts/", include("allauth.urls")),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path("index/", views.index, name="index"),

    # Multi-page LMS dashboard — /dashboard/, /dashboard/my-learning/, etc.
    path('dashboard/', include((dashboard_urlpatterns, 'dashboard'), namespace='dashboard')),

    # Superseded by the LMS dashboard above. Kept only as a reference to
    # the old single-page, localStorage-driven dashboard.html.
    path('legacy-dashboard/', views.legacy_dashboard, name='legacy_dashboard'),

    path('logout/', views.logout_user, name='logout'),
    path('contact/', views.contact, name='contact'),

    # Check this line carefully
    path('hire-connect/', views.hire_connect, name='hire_connect'),

    path('course-details/', views.course_details, name='course_details'),
]
