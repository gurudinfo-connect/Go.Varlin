"""
Access control for the dashboard.

Flow:
  sign in -> dashboard. Every dashboard page just requires login — it no
  longer hard-redirects to a separate "not enrolled yet" page. Each
  dashboard template already renders its own graceful empty state (e.g.
  "No enrolled courses yet." on the overview, "Browse Courses" prompts,
  etc.) when the user has zero enrollments, so the full dashboard shell —
  sidebar, top nav, every page in templates/dashboard/ — is always
  reachable straight after signing in, enrolled or not.
"""
from functools import wraps
from django.contrib.auth.decorators import login_required


def enrollment_required(view_func):
    """Kept as a thin alias around login_required (same name so existing
    view code doesn't need to change). Dashboard pages are gated on being
    signed in only; they no longer require an active enrollment to view."""
    @wraps(view_func)
    @login_required(login_url="signin")
    def _wrapped(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    return _wrapped
