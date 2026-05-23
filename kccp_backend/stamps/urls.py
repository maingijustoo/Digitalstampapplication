from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    StampTypeViewSet,
    ApplicantViewSet,
    StampApplicationViewSet,
    StampRecordViewSet,
    BusinessViewSet,
    FraudReportViewSet,
    ScamAlertViewSet,
    DashboardView,
    DirectorySearchView,
    SubmitReportView,
    PublicReportFeedView,
    PortalDashboardView,
    PortalNotificationsView,
    PortalMyReportsView,
    PortalChangePasswordView,
    AdminReportsView,
    AdminReportDetailView,
    AdminFlagBusinessView,
    AdminResolveReportView,
    AdminRevokeStampView,
    AdminIssueStampToProfileView,
    AdminBusinessProfileListView,
)
from .admin_views import (
    AdminApplicationListView,
    AdminApplicationDetailView,
    AdminStartReviewView,
    AdminApproveView,
    AdminRejectView,
    AdminRecordPaymentView,
    AdminIssueStampView,
    AdminAuditLogView,
    AdminCreateScamAlertView,
    AdminDeleteScamAlertView,
)

# ── Router — ViewSets ─────────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'stamp-types',   StampTypeViewSet,        basename='stamp-type')
router.register(r'applicants',    ApplicantViewSet,        basename='applicant')
router.register(r'applications',  StampApplicationViewSet, basename='application')
router.register(r'stamps',        StampRecordViewSet,      basename='stamp')
router.register(r'businesses',    BusinessViewSet,         basename='business')
router.register(r'fraud-reports', FraudReportViewSet,      basename='fraud-report')
router.register(r'scam-alerts',   ScamAlertViewSet,        basename='scam-alert')

# ── Admin sub-routes (/api/admin/...) ─────────────────────────────────────────
admin_patterns = [

    # ── Application workflow (admin_views.py) ─────────────────────────────
    path('applications/',
         AdminApplicationListView.as_view()),
    path('applications/<int:pk>/',
         AdminApplicationDetailView.as_view()),
    path('applications/<int:pk>/start-review/',
         AdminStartReviewView.as_view()),
    path('applications/<int:pk>/approve/',
         AdminApproveView.as_view()),
    path('applications/<int:pk>/reject/',
         AdminRejectView.as_view()),
    path('applications/<int:pk>/record-payment/',
         AdminRecordPaymentView.as_view()),
    path('applications/<int:pk>/issue-stamp/',
         AdminIssueStampView.as_view()),
    path('applications/<int:pk>/audit-log/',
         AdminAuditLogView.as_view()),

    # ── Full stamp issue: OTP + email + portal account (views.py) ────────
    path('applications/<int:pk>/issue_stamp/',
         AdminIssueStampToProfileView.as_view()),

    # ── Fraud reports — ProfileFraudReport model (views.py) ──────────────
    path('reports/',
         AdminReportsView.as_view()),
    path('reports/<int:pk>/',
         AdminReportDetailView.as_view()),
    path('reports/<int:pk>/resolve/',
         AdminResolveReportView.as_view()),

    # ── Businesses — BusinessProfile model (views.py) ─────────────────────
    path('businesses/<int:pk>/flag/',
         AdminFlagBusinessView.as_view()),
    path('businesses/<int:pk>/revoke_stamp/',
         AdminRevokeStampView.as_view()),
    path('business-profiles/',
         AdminBusinessProfileListView.as_view()),

    # ── Scam alerts (admin_views.py) ──────────────────────────────────────
    path('scam-alerts/',
         AdminCreateScamAlertView.as_view()),
    path('scam-alerts/<int:pk>/',
         AdminDeleteScamAlertView.as_view()),
]

# ── Main URL patterns ─────────────────────────────────────────────────────────
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # JWT auth
    path('token/',         CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(),          name='token_refresh'),

    # Public APIs
    path('directory/search/', DirectorySearchView.as_view(),  name='directory_search'),
    path('reports/',          SubmitReportView.as_view(),      name='submit_report'),
    path('reports/public/',   PublicReportFeedView.as_view(),  name='public_reports'),

    # Portal (JWT required)
    path('portal/dashboard/',       PortalDashboardView.as_view(),      name='portal_dashboard'),
    path('portal/notifications/',   PortalNotificationsView.as_view(),  name='portal_notifications'),
    path('portal/my-reports/',      PortalMyReportsView.as_view(),      name='portal_my_reports'),
    path('portal/change-password/', PortalChangePasswordView.as_view(), name='portal_change_password'),

    # Admin (all routes prefixed /api/admin/...)
    path('admin/', include(admin_patterns)),
]