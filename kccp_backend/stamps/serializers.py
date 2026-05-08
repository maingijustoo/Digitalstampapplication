"""
Serializers for the KCCP Digital Stamp API.
"""

from rest_framework import serializers
from .models import StampType, Applicant, StampApplication, StampRecord, AuditLog, Business, FraudReport, ScamAlert


class StampTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StampType
        fields = '__all__'


class ApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Applicant
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['timestamp']


class StampRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StampRecord
        fields = '__all__'
        read_only_fields = ['issued_at', 'stamp_number']


class StampApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    stamp_type_name = serializers.CharField(source='stamp_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StampApplication
        fields = [
            'id', 'reference_number', 'applicant_name', 'stamp_type_name',
            'status', 'status_display', 'priority', 'fee_paid',
            'submitted_at', 'created_at',
        ]


class StampApplicationDetailSerializer(serializers.ModelSerializer):
    """Full serializer including nested objects."""
    applicant = ApplicantSerializer(read_only=True)
    applicant_id = serializers.PrimaryKeyRelatedField(
        queryset=Applicant.objects.all(), source='applicant', write_only=True
    )
    stamp_type = StampTypeSerializer(read_only=True)
    stamp_type_id = serializers.PrimaryKeyRelatedField(
        queryset=StampType.objects.all(), source='stamp_type', write_only=True
    )
    audit_logs = AuditLogSerializer(many=True, read_only=True)
    stamp_record = StampRecordSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StampApplication
        fields = '__all__'
        read_only_fields = ['reference_number', 'created_at', 'updated_at']


class StampApplicationCreateSerializer(serializers.ModelSerializer):
    """Used when submitting a new application from the frontend."""

    class Meta:
        model = StampApplication
        fields = [
            'id',                  # ← add this
            'reference_number',    # ← add this
            'applicant', 'stamp_type', 'purpose', 'notes', 'priority',
            'document', 'fee_amount',
        ]
        read_only_fields = ['id', 'reference_number']

    def create(self, validated_data):
        application = super().create(validated_data)
        AuditLog.objects.create(
            application=application,
            action='created',
            performed_by='frontend',
            new_value='draft',
            note='Application created via API',
        )
        return application


class StatusUpdateSerializer(serializers.Serializer):
    """Payload for the status-change button actions."""
    status = serializers.ChoiceField(choices=StampApplication.STATUS_CHOICES)
    performed_by = serializers.CharField(max_length=255, default='officer')
    decision_notes = serializers.CharField(required=False, allow_blank=True)


class PaymentSerializer(serializers.Serializer):
    """Record a payment against an application."""
    payment_reference = serializers.CharField(max_length=100)
    performed_by = serializers.CharField(max_length=255, default='cashier')


class IssueStampSerializer(serializers.Serializer):
    """Issue a physical stamp for an approved application."""
    issued_by = serializers.CharField(max_length=255)
    valid_from = serializers.DateField()
    valid_until = serializers.DateField(required=False, allow_null=True)


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BusinessPublicSerializer(serializers.ModelSerializer):
    """Minimal public-facing serializer — no sensitive internal fields."""
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'handle', 'website', 'category',
            'county', 'badge', 'verified_year', 'description',
            'year_established', 'has_physical_address',
        ]


class FraudReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudReport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'status']


class FraudReportPublicSerializer(serializers.ModelSerializer):
    """Anonymised view for the public feed — no reporter email."""
    type = serializers.CharField(source='report_type')

    class Meta:
        model = FraudReport
        fields = ['id', 'business', 'type', 'severity', 'status', 'location', 'created_at']


class ScamAlertSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='alert_type')

    class Meta:
        model = ScamAlert
        fields = ['id', 'title', 'type', 'description', 'location', 'date', 'is_active']


class DashboardSerializer(serializers.Serializer):
    """Summary counts for the dashboard."""
    total = serializers.IntegerField()
    draft = serializers.IntegerField()
    submitted = serializers.IntegerField()
    under_review = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    issued = serializers.IntegerField()
    cancelled = serializers.IntegerField()
    fee_collected = serializers.DecimalField(max_digits=14, decimal_places=2)
