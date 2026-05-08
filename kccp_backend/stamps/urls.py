from django.urls import path, include
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
]
