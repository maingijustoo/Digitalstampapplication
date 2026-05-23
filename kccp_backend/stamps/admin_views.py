"""
KCCP Admin API Views — Application Workflow Only
Handles: list, detail, start-review, approve, reject, record-payment, issue-stamp, audit-log
Everything else (businesses, reports, scam alerts) is handled in views.py
"""

from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from .models import StampApplication, StampRecord, AuditLog, ScamAlert
from .serializers import (
    StampApplicationDetailSerializer,
    StampApplicationListSerializer,
    StampRecordSerializer,
    AuditLogSerializer, 
    ScamAlertSerializer,

)


def _log(application, action, performed_by, old="", new="", note=""):
    AuditLog.objects.create(
        application=application,
        action=action,
        performed_by=performed_by,
        old_value=old,
        new_value=new,
        note=note,
    )


class AdminApplicationListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = StampApplication.objects.select_related(
            'applicant', 'stamp_type'
        ).all()

        s = request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(reference_number__icontains=search) |
                Q(applicant__full_name__icontains=search)
            )

        serializer = StampApplicationListSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': qs.count()})


class AdminApplicationDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            app = StampApplication.objects.select_related(
                'applicant', 'stamp_type'
            ).prefetch_related('audit_logs').get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        return Response(StampApplicationDetailSerializer(app).data)


class AdminStartReviewView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if app.status != 'submitted':
            return Response(
                {'error': f'Cannot start review — current status is "{app.status}".'},
                status=400
            )

        old = app.status
        app.status = 'under_review'
        app.reviewed_by = request.data.get('performed_by', 'admin')
        app.reviewed_at = timezone.now()
        app.save()
        _log(app, 'status_changed', app.reviewed_by, old, 'under_review',
             'Review started by admin')
        return Response(StampApplicationDetailSerializer(app).data)


class AdminApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if app.status != 'under_review':
            return Response(
                {'error': f'Must be under review to approve. Current: "{app.status}".'},
                status=400
            )

        old = app.status
        performed_by = request.data.get('performed_by', 'admin')
        notes = request.data.get('decision_notes', '')
        app.status = 'approved'
        app.reviewed_by = performed_by
        app.reviewed_at = timezone.now()
        app.decision_notes = notes
        app.save()
        _log(app, 'status_changed', performed_by, old, 'approved', notes)
        return Response(StampApplicationDetailSerializer(app).data)


class AdminRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if app.status not in ('submitted', 'under_review'):
            return Response(
                {'error': f'Cannot reject at this stage. Current: "{app.status}".'},
                status=400
            )

        old = app.status
        performed_by = request.data.get('performed_by', 'admin')
        notes = request.data.get('decision_notes', 'Rejected by admin.')
        app.status = 'rejected'
        app.reviewed_by = performed_by
        app.reviewed_at = timezone.now()
        app.decision_notes = notes
        app.save()
        _log(app, 'status_changed', performed_by, old, 'rejected', notes)
        return Response(StampApplicationDetailSerializer(app).data)


class AdminRecordPaymentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        ref = request.data.get('payment_reference', '').strip()
        if not ref:
            return Response({'error': 'payment_reference is required.'}, status=400)

        app.fee_paid = True
        app.payment_reference = ref
        app.save(update_fields=['fee_paid', 'payment_reference', 'updated_at'])
        _log(app, 'payment_recorded',
             request.data.get('performed_by', 'admin'),
             new=ref, note=f'Payment ref: {ref}')
        return Response(StampApplicationDetailSerializer(app).data)


class AdminIssueStampView(APIView):
    """
    Basic stamp issuance — creates StampRecord and updates application status.
    Does NOT create BusinessProfile or send email.
    For the full flow (OTP + email + portal account), the frontend calls
    /api/admin/applications/<id>/issue_stamp/ which routes to
    AdminIssueStampToProfileView in views.py.
    This view is kept for cases where no BusinessProfile is needed.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if app.status != 'approved':
            return Response(
                {'error': 'Application must be approved first.'},
                status=400
            )
        if not app.fee_paid:
            return Response(
                {'error': 'Fee must be paid before issuing stamp.'},
                status=400
            )
        if hasattr(app, 'stamp_record'):
            return Response({'error': 'Stamp already issued.'}, status=400)

        issued_by   = request.data.get('issued_by', 'admin')
        valid_from  = request.data.get('valid_from')
        valid_until = request.data.get('valid_until') or None

        if not valid_from:
            return Response({'error': 'valid_from is required.'}, status=400)

        year = timezone.now().strftime('%Y')
        stamp_number = f"ST-{year}-{app.pk:06d}"

        stamp = StampRecord.objects.create(
            application=app,
            stamp_number=stamp_number,
            issued_by=issued_by,
            valid_from=valid_from,
            valid_until=valid_until,
        )

        old = app.status
        app.status = 'issued'
        app.save()
        _log(app, 'stamp_issued', issued_by, old, 'issued',
             f'Stamp {stamp_number} issued.')

        return Response({
            'application': StampApplicationDetailSerializer(app).data,
            'stamp':       StampRecordSerializer(stamp).data,
        }, status=201)


class AdminAuditLogView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            app = StampApplication.objects.get(pk=pk)
        except StampApplication.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        logs = app.audit_logs.all()
        return Response(AuditLogSerializer(logs, many=True).data)
    

class AdminCreateScamAlertView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        required = ['title', 'description', 'date']
        for f in required:
            if not request.data.get(f):
                return Response({'error': f'{f} is required.'}, status=400)

        alert = ScamAlert.objects.create(
            title       = request.data['title'],
            alert_type  = request.data.get('alert_type', 'Other'),
            description = request.data['description'],
            location    = request.data.get('location', ''),
            date        = request.data['date'],
            is_active   = True,
        )
        return Response(ScamAlertSerializer(alert).data, status=201)


# ── DELETE /api/admin/scam-alerts/{id}/ ──────────────────────────────────────

class AdminDeleteScamAlertView(APIView):
    permission_classes = [IsAdminUser]
    def delete(self, request, pk):
        try:
            ScamAlert.objects.get(pk=pk).delete()
        except ScamAlert.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        return Response(status=204)