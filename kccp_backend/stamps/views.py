"""
KCCP API Views

Every button in the React frontend maps to one of these endpoints.
All data is stored in SQLite during development and can be migrated
to PostgreSQL by changing the DATABASES setting.
"""

from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import StampType, Applicant, StampApplication, StampRecord, AuditLog, Business, FraudReport, ScamAlert, BusinessProfile, ProfileFraudReport, BusinessNotification
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
)


# ─── Stamp Types ──────────────────────────────────────────────────────────────

class StampTypeViewSet(viewsets.ModelViewSet):
    """
    CRUD for stamp types.
    GET  /api/stamp-types/          → list all
    POST /api/stamp-types/          → create new type
    GET  /api/stamp-types/{id}/     → get one
    PUT  /api/stamp-types/{id}/     → update
    DEL  /api/stamp-types/{id}/     → delete
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
    CRUD for applicants.
    GET  /api/applicants/           → list (supports ?search=name)
    POST /api/applicants/           → create
    GET  /api/applicants/{id}/      → detail
    PUT  /api/applicants/{id}/      → update
    DEL  /api/applicants/{id}/      → delete
    GET  /api/applicants/{id}/applications/ → all applications for this person
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
    """
    Core resource – one application = one stamp request.

    List / search:
        GET  /api/applications/                     → all
        GET  /api/applications/?status=submitted    → filter by status
        GET  /api/applications/?search=KCCP-2025   → search ref / name

    Create:
        POST /api/applications/                     → new application (status=draft)

    Detail:
        GET  /api/applications/{id}/                → full detail with audit log
        PUT  /api/applications/{id}/                → update fields
        DEL  /api/applications/{id}/                → delete (draft only)

    Button actions (all POST):
        POST /api/applications/{id}/submit/         → SUBMIT button
        POST /api/applications/{id}/review/         → START REVIEW button
        POST /api/applications/{id}/approve/        → APPROVE button
        POST /api/applications/{id}/reject/         → REJECT button
        POST /api/applications/{id}/cancel/         → CANCEL button
        POST /api/applications/{id}/record_payment/ → MARK PAID button
        POST /api/applications/{id}/issue_stamp/    → ISSUE STAMP button
        GET  /api/applications/{id}/audit_log/      → full audit trail
    """

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

    # ── Helper: change status + write audit log ────────────────────────────

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

    # ── Button: SUBMIT ─────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Button: Submit Application
        Moves status draft → submitted.
        """
        application = self.get_object()
        if application.status != 'draft':
            return Response(
                {'error': f'Cannot submit an application with status "{application.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = StatusUpdateSerializer(data={
            'status': 'submitted',
            **request.data,
        })
        serializer.is_valid(raise_exception=True)
        self._change_status(
            application, 'submitted',
            serializer.validated_data.get('performed_by', 'applicant'),
            serializer.validated_data.get('decision_notes', ''),
        )
        return Response(
            StampApplicationDetailSerializer(application).data,
            status=status.HTTP_200_OK,
        )

    # ── Button: START REVIEW ───────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        """Button: Start Review — submitted → under_review."""
        application = self.get_object()
        if application.status != 'submitted':
            return Response(
                {'error': 'Application must be in "submitted" state to begin review.'},
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

    # ── Button: APPROVE ────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Button: Approve — under_review → approved."""
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

    # ── Button: REJECT ─────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Button: Reject — under_review → rejected."""
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

    # ── Button: CANCEL ─────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def cancel(self, request, pk=None):
        """Button: Cancel — any non-final status → cancelled."""
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

    # ── Button: MARK PAID ──────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def record_payment(self, request, pk=None):
        """
        Button: Mark as Paid.
        Body: { payment_reference: "MPesa-XXXXX", performed_by: "cashier" }
        """
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

    # ── Button: ISSUE STAMP ────────────────────────────────────────────────

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def issue_stamp(self, request, pk=None):
        """
        Button: Issue Stamp — approved + fee_paid → issued.
        Body: { issued_by, valid_from, valid_until? }
        Creates a StampRecord.
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

        # Generate unique stamp number
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

    # ── GET: Audit Log ─────────────────────────────────────────────────────

    @action(detail=True, methods=['get'])
    def audit_log(self, request, pk=None):
        """Return the full audit trail for an application."""
        application = self.get_object()
        logs = application.audit_logs.all()
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ─── Stamp Records ────────────────────────────────────────────────────────────

class StampRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/stamps/         → list all issued stamps
    GET /api/stamps/{id}/    → detail
    """
    queryset = StampRecord.objects.select_related('application__applicant').all()
    serializer_class = StampRecordSerializer


# ─── Businesses ───────────────────────────────────────────────────────────────

class BusinessViewSet(viewsets.ModelViewSet):
    """
    Public search + CRUD for businesses.

    GET  /api/businesses/                      → list (public, minimal fields)
    GET  /api/businesses/?search=name          → search by name or handle
    GET  /api/businesses/?badge=verified       → filter by badge
    POST /api/businesses/                      → create (internal use)
    GET  /api/businesses/{id}/                 → detail
    GET  /api/businesses/verify/?q=handle      → verify a specific business by handle/name
    """
    queryset = Business.objects.filter(is_active=True)

    def get_serializer_class(self):
        # Full serializer for write operations; public for reads
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
        """
        GET /api/businesses/verify/?q=@handle
        Returns the badge status for a specific business.
        Used by the search bar on Home and VerifyBusiness pages.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'error': 'Query parameter ?q= is required.'}, status=400)

        qs = Business.objects.filter(
            Q(name__icontains=q) | Q(handle__icontains=q) | Q(website__icontains=q)
        )
        serializer = BusinessPublicSerializer(qs, many=True)
        return Response(serializer.data)


# ─── Fraud Reports ─────────────────────────────────────────────────────────────

class FraudReportViewSet(viewsets.ModelViewSet):
    """
    GET  /api/fraud-reports/        → public anonymised feed
    POST /api/fraud-reports/        → submit a new report (Report Fraud page)
    GET  /api/fraud-reports/{id}/   → detail (admin only in production)
    """
    queryset = FraudReport.objects.filter(is_public=True)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FraudReportSerializer   # accepts full fields on create
        return FraudReportPublicSerializer  # anonymised on reads

    def get_queryset(self):
        qs = super().get_queryset()
        severity = self.request.query_params.get('severity')
        status   = self.request.query_params.get('status')
        if severity:
            qs = qs.filter(severity=severity)
        if status:
            qs = qs.filter(status=status)
        return qs


# ─── Scam Alerts ───────────────────────────────────────────────────────────────

class ScamAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET  /api/scam-alerts/          → list active alerts
    GET  /api/scam-alerts/{id}/     → detail
    """
    queryset = ScamAlert.objects.filter(is_active=True)
    serializer_class = ScamAlertSerializer


# ─── Dashboard / Summary ──────────────────────────────────────────────────────


class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns counts and totals for the main dashboard.
    """

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
            # bonus stats for the home page
            'verified_businesses': Business.objects.filter(badge='verified').count(),
            'fraud_reports':       FraudReport.objects.count(),
            'active_alerts':       ScamAlert.objects.filter(is_active=True).count(),
        }
        serializer = DashboardSerializer(data)
        return Response(serializer.data)

class DirectorySearchView(APIView):
    """
    GET /api/directory/search/?q=<handle>
    Public. Returns matching BusinessProfile(s) with trust score and stamp status.
    """

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


# ─── Public: Submit Fraud Report ──────────────────────────────────────────────

class SubmitReportView(APIView):
    """
    POST /api/reports/
    Public. Consumer submits a fraud report against a BusinessProfile.
    Severity is auto-calculated in ProfileFraudReport.save().
    """

    def post(self, request):
        serializer = ProfileFraudReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        # Notify the business owner
        BusinessNotification.objects.create(
            business=report.business,
            title='New Fraud Report Filed',
            message=f'A new {report.severity_category}-severity report has been filed against your business.',
            type='new_report',
        )
        return Response(
            ProfileFraudReportSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Public: Anonymised Report Feed ──────────────────────────────────────────

class PublicReportFeedView(APIView):
    """
    GET /api/reports/public/
    Public. Returns latest anonymised ProfileFraudReports for the homepage.
    """

    def get(self, request):
        reports = ProfileFraudReport.objects.all()[:20]
        serializer = ProfileFraudReportPublicSerializer(reports, many=True)
        return Response(serializer.data)


# ─── Portal: Dashboard (JWT Required) ────────────────────────────────────────

class PortalDashboardView(APIView):
    """
    GET /api/portal/dashboard/
    Returns the logged-in business's trust score, report counts, stamp status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'No business profile found for this user.'}, status=404)

        reports = profile.fraud_reports.all()
        data = {
            'business_name':       profile.business_name,
            'business_handle':     profile.business_handle,
            'is_verified':         profile.is_verified,
            'badge_status':        profile.badge_status,
            'certificate_id':      profile.certificate_id,
            'trust_score':         profile.current_trust_score,
            'open_reports':        reports.filter(status__in=['open', 'investigating']).count(),
            'resolved_reports':    reports.filter(status='resolved').count(),
            'total_reports':       reports.count(),
            'unread_notifications': profile.notifications.filter(is_read=False).count(),
        }
        serializer = PortalDashboardSerializer(data)
        return Response(serializer.data)


# ─── Portal: Notifications (JWT Required) ────────────────────────────────────

class PortalNotificationsView(APIView):
    """
    GET /api/portal/notifications/
    Returns unread BusinessNotification objects for the logged-in business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'No business profile found for this user.'}, status=404)

        notifications = profile.notifications.filter(is_read=False)
        serializer = BusinessNotificationSerializer(notifications, many=True)
        return Response(serializer.data)


# ─── Portal: My Reports (JWT Required) ───────────────────────────────────────

class PortalMyReportsView(APIView):
    """
    GET /api/portal/my-reports/
    Returns ProfileFraudReport objects filed against the logged-in business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'No business profile found for this user.'}, status=404)

        reports = profile.fraud_reports.all()
        serializer = ProfileFraudReportSerializer(reports, many=True)
        return Response(serializer.data)


# ─── Admin: All Reports (IsAdminUser Required) ────────────────────────────────

class AdminReportsView(APIView):
    """
    GET  /api/admin/reports/          → all reports, supports ?status= and ?severity=
    """
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


class AdminReportDetailView(APIView):
    """
    DELETE /api/admin/reports/<id>/
    Hard-deletes a spam/false report and recalculates the business trust score.
    (Trust score is a live @property so no extra step needed — it recalculates on next fetch.)
    """
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            report = ProfileFraudReport.objects.get(pk=pk)
        except ProfileFraudReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)

        report.delete()
        # Trust score is a @property — recalculates automatically on next request.
        return Response({'success': True, 'deleted_id': pk}, status=status.HTTP_200_OK)


# ─── Admin: Flag Business (IsAdminUser Required) ──────────────────────────────

class AdminFlagBusinessView(APIView):
    """
    POST /api/admin/businesses/<id>/flag/
    Body: { "reason": "Multiple severe fraud reports" }
    Sets badge_status = 'flagged', is_verified = False,
    and creates a BusinessNotification to inform the owner.
    """
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

        return Response({
            'success':      True,
            'business_id':  pk,
            'badge_status': profile.badge_status,
            'trust_score':  profile.current_trust_score,
        })


# ─── Admin: Approve / Issue Stamp — secure existing actions ──────────────────
# NOTE: The existing StampApplicationViewSet.approve() and .issue_stamp() actions
# are modified below to require IsAdminUser. Add permission_classes directly
# on those @action methods in StampApplicationViewSet (shown as a targeted patch).
#
# In StampApplicationViewSet, change:
#
#   @action(detail=True, methods=['post'])
#   def approve(self, request, pk=None):
#
# to:
#
#   @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
#   def approve(self, request, pk=None):
#
# Apply the same to: reject(), issue_stamp()