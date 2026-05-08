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

from .models import StampType, Applicant, StampApplication, StampRecord, AuditLog, Business, FraudReport, ScamAlert
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

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
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

    @action(detail=True, methods=['post'])
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
