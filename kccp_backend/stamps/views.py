"""
KCCP API Views
Every button in the React frontend maps to one of these endpoints.
"""

import secrets
import string

from django.utils import timezone
from django.db.models import Sum, Q
from django.contrib.auth.models import User

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import (
    send_stamp_issued_email,
    send_flagged_email,
    send_report_notification_email,
)
from .models import (
    StampType, Applicant, StampApplication, StampRecord,
    AuditLog, Business, FraudReport, ScamAlert,
    BusinessProfile, ProfileFraudReport, BusinessNotification,
)
from .serializers import (
    StampTypeSerializer,
    ApplicantSerializer,
    AuditLogSerializer,
    StampRecordSerializer,
    StampApplicationListSerializer,
    StampApplicationDetailSerializer,
    StampApplicationCreateSerializer,
    StatusUpdateSerializer,
    PaymentSerializer,
    IssueStampSerializer,
    DashboardSerializer,
    BusinessSerializer,
    BusinessPublicSerializer,
    FraudReportSerializer,
    FraudReportPublicSerializer,
    ScamAlertSerializer,
    BusinessProfileSerializer,
    BusinessProfilePublicSerializer,
    ProfileFraudReportSerializer,
    ProfileFraudReportPublicSerializer,
    BusinessNotificationSerializer,
    PortalDashboardSerializer,
    CustomTokenObtainPairSerializer,
)


# ── Utility ───────────────────────────────────────────────────────────────────

def generate_otp():
    """Generates a readable one-time password like KCCP-ABCD-1234."""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"KCCP-{part1}-{part2}"


# ─── JWT ──────────────────────────────────────────────────────────────────────

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/token/
    Returns JWT with is_staff claim included.
    """
    serializer_class = CustomTokenObtainPairSerializer


# ─── Stamp Types ──────────────────────────────────────────────────────────────

class StampTypeViewSet(viewsets.ModelViewSet):
    """
    GET  /api/stamp-types/      → list all
    POST /api/stamp-types/      → create
    GET  /api/stamp-types/{id}/ → get one
    PUT  /api/stamp-types/{id}/ → update
    DEL  /api/stamp-types/{id}/ → delete
    """
    queryset = StampType.objects.all()
    serializer_class = StampTypeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('active_only'):
            qs = qs.filter(is_active=True)
        return qs


# ─── Applicants ───────────────────────────────────────────────────────────────

class ApplicantViewSet(viewsets.ModelViewSet):
    """
    GET  /api/applicants/                       → list
    POST /api/applicants/                       → create
    GET  /api/applicants/{id}/                  → detail
    GET  /api/applicants/{id}/applications/     → all applications
    """
    queryset = Applicant.objects.all()
    serializer_class = ApplicantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(id_number__icontains=search) |
                Q(email__icontains=search)
            )
        return qs

    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        applicant = self.get_object()
        apps = applicant.applications.all()
        serializer = StampApplicationListSerializer(apps, many=True)
        return Response(serializer.data)


# ─── Stamp Applications ───────────────────────────────────────────────────────

class StampApplicationViewSet(viewsets.ModelViewSet):
    queryset = StampApplication.objects.select_related('applicant', 'stamp_type').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return StampApplicationCreateSerializer
        if self.action == 'list':
            return StampApplicationListSerializer
        return StampApplicationDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status_filter = params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        priority_filter = params.get('priority')
        if priority_filter:
            qs = qs.filter(priority=priority_filter)

        stamp_type = params.get('stamp_type')
        if stamp_type:
            qs = qs.filter(stamp_type_id=stamp_type)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(reference_number__icontains=search) |
                Q(applicant__full_name__icontains=search) |
                Q(applicant__id_number__icontains=search)
            )
        return qs

    def _change_status(self, application, new_status, performed_by, notes=''):
        old_status = application.status
        application.status = new_status
        if notes:
            application.decision_notes = notes
        if new_status == 'submitted':
            application.submitted_at = timezone.now()
        if new_status in ('approved', 'rejected', 'under_review'):
            application.reviewed_by = performed_by
            application.reviewed_at = timezone.now()
        application.save()
        AuditLog.objects.create(
            application=application,
            action='status_changed',
            performed_by=performed_by,
            old_value=old_status,
            new_value=new_status,
            note=notes,
        )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """draft → submitted"""
        application = self.get_object()
        if application.status != 'draft':
            return Response(
                {'error': f'Cannot submit an application with status "{application.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={'status': 'submitted', **request.data})
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'submitted',
            serializer.validated_data.get('performed_by', 'applicant'),
            serializer.validated_data.get('decision_notes', ''),
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        """submitted → under_review"""
        application = self.get_object()
        if application.status != 'submitted':
            return Response(
                {'error': 'Application must be submitted before review.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={'status': 'under_review', **request.data})
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'under_review',
            serializer.validated_data.get('performed_by', 'officer'),
            serializer.validated_data.get('decision_notes', ''),
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """under_review → approved"""
        application = self.get_object()
        if application.status != 'under_review':
            return Response(
                {'error': 'Application must be under review to approve.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={'status': 'approved', **request.data})
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'approved',
            serializer.validated_data.get('performed_by', 'officer'),
            serializer.validated_data.get('decision_notes', ''),
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """submitted|under_review → rejected"""
        application = self.get_object()
        if application.status not in ('submitted', 'under_review'):
            return Response(
                {'error': 'Application cannot be rejected at this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={'status': 'rejected', **request.data})
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'rejected',
            serializer.validated_data.get('performed_by', 'officer'),
            serializer.validated_data.get('decision_notes', 'Rejected.'),
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def cancel(self, request, pk=None):
        """any non-final → cancelled"""
        application = self.get_object()
        if application.status in ('issued', 'cancelled'):
            return Response(
                {'error': f'Application already in final state: {application.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={'status': 'cancelled', **request.data})
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'cancelled',
            serializer.validated_data.get('performed_by', 'officer'),
            serializer.validated_data.get('decision_notes', ''),
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def record_payment(self, request, pk=None):
        """Mark fee as paid."""
        application = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application.fee_paid = True
        application.payment_reference = serializer.validated_data['payment_reference']
        application.save(update_fields=['fee_paid', 'payment_reference', 'updated_at'])
        AuditLog.objects.create(
            application=application,
            action='payment_recorded',
            performed_by=serializer.validated_data.get('performed_by', 'cashier'),
            new_value=serializer.validated_data['payment_reference'],
            note=f"Payment reference: {serializer.validated_data['payment_reference']}",
        )
        return Response(StampApplicationDetailSerializer(application).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def issue_stamp(self, request, pk=None):
        """
        approved + fee_paid → issued.
        Creates StampRecord only — does NOT create BusinessProfile.
        Use /api/admin/applications/<id>/issue_stamp/ for the full flow
        that creates the portal account.
        """
        application = self.get_object()
        if application.status != 'approved':
            return Response(
                {'error': 'Stamp can only be issued for approved applications.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not application.fee_paid:
            return Response(
                {'error': 'Fee must be paid before issuing the stamp.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if hasattr(application, 'stamp_record'):
            return Response(
                {'error': 'Stamp already issued for this application.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = IssueStampSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        year = timezone.now().strftime('%Y')
        stamp_number = f"ST-{year}-{application.pk:06d}"
        stamp = StampRecord.objects.create(
            application=application,
            stamp_number=stamp_number,
            issued_by=serializer.validated_data['issued_by'],
            valid_from=serializer.validated_data['valid_from'],
            valid_until=serializer.validated_data.get('valid_until'),
        )
        self._change_status(
            application, 'issued',
            serializer.validated_data['issued_by'],
            f"Stamp {stamp_number} issued.",
        )
        AuditLog.objects.create(
            application=application,
            action='stamp_issued',
            performed_by=serializer.validated_data['issued_by'],
            new_value=stamp_number,
        )
        return Response(
            {
                'application': StampApplicationDetailSerializer(application).data,
                'stamp': StampRecordSerializer(stamp).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'])
    def audit_log(self, request, pk=None):
        application = self.get_object()
        logs = application.audit_logs.all()
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ─── Stamp Records ────────────────────────────────────────────────────────────

class StampRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StampRecord.objects.select_related('application__applicant').all()
    serializer_class = StampRecordSerializer


# ─── Businesses ───────────────────────────────────────────────────────────────

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return BusinessSerializer
        return BusinessPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        badge  = self.request.query_params.get('badge')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(handle__icontains=search) |
                Q(website__icontains=search)
            )
        if badge:
            qs = qs.filter(badge=badge)
        return qs

    @action(detail=False, methods=['get'])
    def verify(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'error': 'Query parameter ?q= is required.'}, status=400)
        qs = Business.objects.filter(
            Q(name__icontains=q) | Q(handle__icontains=q) | Q(website__icontains=q)
        )
        serializer = BusinessPublicSerializer(qs, many=True)
        return Response(serializer.data)


# ─── Fraud Reports (legacy) ───────────────────────────────────────────────────

class FraudReportViewSet(viewsets.ModelViewSet):
    queryset = FraudReport.objects.filter(is_public=True)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FraudReportSerializer
        return FraudReportPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        severity = self.request.query_params.get('severity')
        status_f = self.request.query_params.get('status')
        if severity:
            qs = qs.filter(severity=severity)
        if status_f:
            qs = qs.filter(status=status_f)
        return qs


# ─── Scam Alerts ──────────────────────────────────────────────────────────────

class ScamAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScamAlert.objects.filter(is_active=True)
    serializer_class = ScamAlertSerializer


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardView(APIView):
    def get(self, request):
        apps = StampApplication.objects.all()
        statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'issued', 'cancelled']
        counts = {s: apps.filter(status=s).count() for s in statuses}
        fee_collected = apps.filter(fee_paid=True).aggregate(
            total=Sum('fee_amount')
        )['total'] or 0
        data = {
            'total': apps.count(),
            **counts,
            'fee_collected': fee_collected,
            'verified_businesses': Business.objects.filter(badge='verified').count(),
            'fraud_reports':       FraudReport.objects.count(),
            'active_alerts':       ScamAlert.objects.filter(is_active=True).count(),
        }
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


# ─── Public: Directory Search ─────────────────────────────────────────────────

class DirectorySearchView(APIView):
    """GET /api/directory/search/?q=<handle>"""

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'error': 'Query parameter ?q= is required.'}, status=400)
        profiles = BusinessProfile.objects.filter(
            Q(business_name__icontains=q) |
            Q(business_handle__icontains=q)
        )
        serializer = BusinessProfilePublicSerializer(profiles, many=True)
        return Response(serializer.data)


# ─── Public: Submit Fraud Report ─────────────────────────────────────────────

class SubmitReportView(APIView):
    """POST /api/reports/"""

    def post(self, request):
        serializer = ProfileFraudReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()

        # In-app notification
        BusinessNotification.objects.create(
            business=report.business,
            title='New Fraud Report Filed',
            message=(
                f'A new {report.severity_category}-severity report has been '
                f'filed against your business.'
            ),
            type='new_report',
        )

        # Email notification to business owner
        if report.business.user.email:
            send_report_notification_email(
                to_email=report.business.user.email,
                business_name=report.business.business_name,
                report_type=report.report_type,
                severity=report.severity_category,
            )

        return Response(
            ProfileFraudReportSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Public: Anonymised Report Feed ──────────────────────────────────────────

class PublicReportFeedView(APIView):
    """GET /api/reports/public/"""

    def get(self, request):
        reports = ProfileFraudReport.objects.all()[:20]
        serializer = ProfileFraudReportPublicSerializer(reports, many=True)
        return Response(serializer.data)


# ─── Portal: Dashboard ───────────────────────────────────────────────────────

class PortalDashboardView(APIView):
    """GET /api/portal/dashboard/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response(
                {'error': 'No business profile found for this user.'},
                status=404,
            )
        reports = profile.fraud_reports.all()
        data = {
            'business_name':        profile.business_name,
            'business_handle':      profile.business_handle,
            'is_verified':          profile.is_verified,
            'badge_status':         profile.badge_status,
            'certificate_id':       profile.certificate_id,
            'trust_score':          profile.current_trust_score,
            'open_reports':         reports.filter(status__in=['open', 'investigating']).count(),
            'resolved_reports':     reports.filter(status='resolved').count(),
            'total_reports':        reports.count(),
            'unread_notifications': profile.notifications.filter(is_read=False).count(),
        }
        serializer = PortalDashboardSerializer(data)
        return Response(serializer.data)


# ─── Portal: Notifications ───────────────────────────────────────────────────

class PortalNotificationsView(APIView):
    """GET /api/portal/notifications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response(
                {'error': 'No business profile found for this user.'},
                status=404,
            )
        notifications = profile.notifications.filter(is_read=False)
        serializer = BusinessNotificationSerializer(notifications, many=True)
        return Response(serializer.data)


# ─── Portal: My Reports ──────────────────────────────────────────────────────

class PortalMyReportsView(APIView):
    """GET /api/portal/my-reports/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response(
                {'error': 'No business profile found for this user.'},
                status=404,
            )
        reports = profile.fraud_reports.all()
        serializer = ProfileFraudReportSerializer(reports, many=True)
        return Response(serializer.data)


# ─── Portal: Change Password ─────────────────────────────────────────────────

class PortalChangePasswordView(APIView):
    """POST /api/portal/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password     = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both current_password and new_password are required.'},
                status=400,
            )
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters.'},
                status=400,
            )
        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=400,
            )
        request.user.set_password(new_password)
        request.user.save()
        return Response({'success': True, 'message': 'Password changed successfully.'})


# ─── Admin: All Reports ───────────────────────────────────────────────────────

class AdminReportsView(APIView):
    """GET /api/admin/reports/"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = ProfileFraudReport.objects.select_related('business').all()
        status_filter   = request.query_params.get('status')
        severity_filter = request.query_params.get('severity')
        if status_filter:
            reports = reports.filter(status=status_filter)
        if severity_filter:
            reports = reports.filter(severity_category=severity_filter)
        serializer = ProfileFraudReportSerializer(reports, many=True)
        return Response(serializer.data)


# ─── Admin: Delete Report ─────────────────────────────────────────────────────

class AdminReportDetailView(APIView):
    """DELETE /api/admin/reports/<id>/"""
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            report = ProfileFraudReport.objects.get(pk=pk)
        except ProfileFraudReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)
        report.delete()
        return Response({'success': True, 'deleted_id': pk})


# ─── Admin: Resolve Report ────────────────────────────────────────────────────

class AdminResolveReportView(APIView):
    """POST /api/admin/reports/<id>/resolve/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = ProfileFraudReport.objects.get(pk=pk)
        except ProfileFraudReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)

        report.status = 'resolved'
        report.resolved_at = timezone.now()
        report.save(update_fields=['status', 'resolved_at'])

        BusinessNotification.objects.create(
            business=report.business,
            title='Fraud Report Resolved',
            message='A fraud report filed against your business has been marked as resolved.',
            type='system',
        )
        return Response(ProfileFraudReportSerializer(report).data)


# ─── Admin: Flag Business ─────────────────────────────────────────────────────

class AdminFlagBusinessView(APIView):
    """POST /api/admin/businesses/<id>/flag/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = BusinessProfile.objects.get(pk=pk)
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'Business profile not found.'}, status=404)

        reason = request.data.get('reason', 'Flagged by KCCP administrator.')

        profile.badge_status = 'flagged'
        profile.is_verified  = False
        profile.save(update_fields=['badge_status', 'is_verified', 'updated_at'])

        BusinessNotification.objects.create(
            business=profile,
            title='Your Business Has Been Flagged',
            message=f'KCCP has flagged your business account. Reason: {reason}',
            type='system',
        )

        # Email the business owner
        if profile.user.email:
            send_flagged_email(
                to_email=profile.user.email,
                business_name=profile.business_name,
                reason=reason,
            )

        return Response({
            'success':      True,
            'business_id':  pk,
            'badge_status': profile.badge_status,
            'trust_score':  profile.current_trust_score,
        })


# ─── Admin: Revoke Stamp ──────────────────────────────────────────────────────

class AdminRevokeStampView(APIView):
    """POST /api/admin/businesses/<id>/revoke_stamp/"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            profile = BusinessProfile.objects.get(pk=pk)
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'Business profile not found.'}, status=404)

        reason = request.data.get('reason', 'Stamp revoked by KCCP administrator.')

        profile.is_verified    = False
        profile.badge_status   = 'unverified'
        profile.certificate_id = None
        profile.save(update_fields=['is_verified', 'badge_status', 'certificate_id', 'updated_at'])

        BusinessNotification.objects.create(
            business=profile,
            title='Your Digital Stamp Has Been Revoked',
            message=f'KCCP has revoked your digital stamp. Reason: {reason}',
            type='system',
        )

        return Response({
            'success':      True,
            'business_id':  pk,
            'is_verified':  profile.is_verified,
            'badge_status': profile.badge_status,
        })


# ─── Admin: Issue Stamp + Create Portal Account ───────────────────────────────

class AdminIssueStampToProfileView(APIView):
    """
    POST /api/admin/applications/<id>/issue_stamp/
    Body: { issued_by, valid_from, valid_until? }

    Full flow:
    1. Creates StampRecord
    2. Auto-creates Django User + BusinessProfile if none exists
    3. Generates a one-time password (shown once in response)
    4. Marks BusinessProfile as verified
    5. Sends email with login credentials to applicant email
    6. Creates in-app BusinessNotification
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            application = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=404)

        if application.status != 'approved':
            return Response(
                {'error': 'Stamp can only be issued for approved applications.'},
                status=400,
            )
        if not application.fee_paid:
            return Response(
                {'error': 'Fee must be paid before issuing the stamp.'},
                status=400,
            )
        if hasattr(application, 'stamp_record'):
            return Response(
                {'error': 'Stamp already issued for this application.'},
                status=400,
            )

        # ── Create StampRecord ────────────────────────────────────────────
        year         = timezone.now().strftime('%Y')
        stamp_number = f"ST-{year}-{application.pk:06d}"

        stamp = StampRecord.objects.create(
            application=application,
            stamp_number=stamp_number,
            issued_by=request.data.get('issued_by', 'admin'),
            valid_from=request.data.get('valid_from'),
            valid_until=request.data.get('valid_until'),
        )

        # ── Update application status ─────────────────────────────────────
        application.status = 'issued'
        application.save(update_fields=['status', 'updated_at'])

        AuditLog.objects.create(
            application=application,
            action='stamp_issued',
            performed_by=request.data.get('issued_by', 'admin'),
            new_value=stamp_number,
        )

        # ── Create or update BusinessProfile ─────────────────────────────
        one_time_password = None
        username          = None
        profile           = None

        # Parse handle from application notes
        notes        = application.notes or ''
        handle_line  = next((l for l in notes.split('|') if 'Handle:' in l), '')
        raw_handle   = handle_line.replace('Handle:', '').strip()

        # Derive username from email or name
        base_username = (
            application.applicant.email.split('@')[0]
            if application.applicant.email
            else application.applicant.full_name.lower().replace(' ', '_')
        )
        username  = base_username
        counter   = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Derive unique handle
        business_handle  = raw_handle if raw_handle else username
        handle_counter   = 1
        original_handle  = business_handle
        while BusinessProfile.objects.filter(business_handle=business_handle).exists():
            business_handle = f"{original_handle}{handle_counter}"
            handle_counter += 1

        # Check if profile already exists via User
        existing_user = User.objects.filter(
            username=base_username
        ).first()

        if existing_user and hasattr(existing_user, 'business_profile'):
            # Profile already exists — just update verification fields
            profile = existing_user.business_profile
            profile.is_verified    = True
            profile.badge_status   = 'verified'
            profile.certificate_id = stamp_number
            profile.save(update_fields=[
                'is_verified', 'badge_status', 'certificate_id', 'updated_at'
            ])
        else:
            # Create new User + BusinessProfile
            one_time_password = generate_otp()

            # Parse category and county from purpose
            purpose  = application.purpose or ''
            category = 'other'
            county   = ''
            for line in purpose.split('.'):
                if 'Category:' in line:
                    category = line.replace('Category:', '').strip().lower()[:50]
                if 'County:' in line:
                    county = line.replace('County:', '').strip()[:100]

            new_user = User.objects.create_user(
                username=username,
                email=application.applicant.email or '',
                password=one_time_password,
                first_name=application.applicant.full_name,
            )

            profile = BusinessProfile.objects.create(
                user            = new_user,
                business_name   = application.applicant.full_name,
                business_handle = business_handle,
                category        = category,
                county          = county,
                is_verified     = True,
                badge_status    = 'verified',
                certificate_id  = stamp_number,
                phone           = application.applicant.phone or '',
            )

        # ── Notification message ──────────────────────────────────────────
        if one_time_password:
            notif_message = (
                f'Your KCCP Digital Trust Stamp ({stamp_number}) has been issued! '
                f'Portal login — Username: {username} | '
                f'One-Time Password: {one_time_password} | '
                f'Log in at /business-portal and change your password under Settings.'
            )
        else:
            notif_message = (
                f'Your KCCP Digital Trust Stamp ({stamp_number}) has been issued! '
                f'Log in to your business portal to view your verified dashboard.'
            )

        if profile:
            BusinessNotification.objects.create(
                business=profile,
                title='🏷 Your Digital Stamp Has Been Issued!',
                message=notif_message,
                type='stamp_approved',
            )

            # ── Send email ────────────────────────────────────────────────
            if one_time_password and application.applicant.email:
                send_stamp_issued_email(
                    to_email=application.applicant.email,
                    business_name=profile.business_name,
                    username=username,
                    one_time_password=one_time_password,
                    stamp_number=stamp_number,
                )

        return Response({
            'application':              StampApplicationDetailSerializer(application).data,
            'stamp':                    StampRecordSerializer(stamp).data,
            'portal_username':          username,
            'one_time_password':        one_time_password,  # None if profile already existed
            'business_profile_created': one_time_password is not None,
        }, status=status.HTTP_201_CREATED)


class AdminBusinessProfileListView(APIView):
    """
    GET /api/admin/business-profiles/
    Returns all BusinessProfile objects for the admin directory tab.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        profiles = BusinessProfile.objects.select_related('user').all()
        if search:
            profiles = profiles.filter(
                Q(business_name__icontains=search) |
                Q(business_handle__icontains=search)
            )
        serializer = BusinessProfileSerializer(profiles, many=True)
        return Response({'results': serializer.data, 'count': profiles.count()})