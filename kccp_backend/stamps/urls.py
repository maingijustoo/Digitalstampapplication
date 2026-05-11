from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
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
    AdminReportsView,
    AdminReportDetailView,
    AdminFlagBusinessView,
)

router = DefaultRouter()
router.register(r'stamp-types',   StampTypeViewSet,        basename='stamp-type')
router.register(r'applicants',    ApplicantViewSet,        basename='applicant')
router.register(r'applications',  StampApplicationViewSet, basename='application')
router.register(r'stamps',        StampRecordViewSet,      basename='stamp')
router.register(r'businesses',    BusinessViewSet,         basename='business')
router.register(r'fraud-reports', FraudReportViewSet,      basename='fraud-report')
router.register(r'scam-alerts',   ScamAlertViewSet,        basename='scam-alert')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # ── JWT Auth ──────────────────────────────────────────────────────────
    path('token/',         TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),

    # ── Public APIs ───────────────────────────────────────────────────────
    path('directory/search/',  DirectorySearchView.as_view(),  name='directory_search'),
    path('reports/',           SubmitReportView.as_view(),      name='submit_report'),
    path('reports/public/',    PublicReportFeedView.as_view(),  name='public_reports'),

    # ── Portal (JWT required) ─────────────────────────────────────────────
    path('portal/dashboard/',     PortalDashboardView.as_view(),     name='portal_dashboard'),
    path('portal/notifications/', PortalNotificationsView.as_view(), name='portal_notifications'),
    path('portal/my-reports/',    PortalMyReportsView.as_view(),     name='portal_my_reports'),

    # ── Admin (IsAdminUser required) ──────────────────────────────────────
    path('admin/reports/',              AdminReportsView.as_view(),         name='admin_reports'),
    path('admin/reports/<int:pk>/',     AdminReportDetailView.as_view(),    name='admin_report_detail'),
    path('admin/businesses/<int:pk>/flag/', AdminFlagBusinessView.as_view(), name='admin_flag_business'),
]
