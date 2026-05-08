"""
KCCP – Digital Stamp Application Models

Tables (ready to migrate to PostgreSQL):
  - StampType       : master list of stamp categories
  - Applicant       : person/organisation requesting a stamp
  - StampApplication: a single application submission
  - StampRecord     : an issued / approved stamp
  - AuditLog        : every status change, append-only
"""

from django.db import models
from django.utils import timezone


class StampType(models.Model):
    """Master table: types of stamps the system can issue."""

    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Stamp Type'
        verbose_name_plural = 'Stamp Types'

    def __str__(self):
        return f"{self.code} – {self.name}"


class Applicant(models.Model):
    """Person or organisation requesting a stamp."""

    APPLICANT_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('company', 'Company'),
        ('government', 'Government Body'),
    ]

    full_name = models.CharField(max_length=255)
    applicant_type = models.CharField(
        max_length=20, choices=APPLICANT_TYPE_CHOICES, default='individual'
    )
    id_number = models.CharField(max_length=100, blank=True, help_text='National ID / Registration number')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.id_number or 'no ID'})"


class StampApplication(models.Model):
    """A submission by an applicant requesting a stamp."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('issued', 'Issued'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('express', 'Express'),
    ]

    # Reference number generated on save
    reference_number = models.CharField(max_length=50, unique=True, blank=True)

    applicant = models.ForeignKey(
        Applicant, on_delete=models.CASCADE, related_name='applications'
    )
    stamp_type = models.ForeignKey(
        StampType, on_delete=models.PROTECT, related_name='applications'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')

    purpose = models.TextField(help_text='Why is this stamp being requested?')
    notes = models.TextField(blank=True)

    # Supporting document upload (stored in media/documents/)
    document = models.FileField(upload_to='documents/%Y/%m/', blank=True, null=True)

    # Fee tracking
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fee_paid = models.BooleanField(default=False)
    payment_reference = models.CharField(max_length=100, blank=True)

    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.CharField(max_length=255, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    decision_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Stamp Application'
        verbose_name_plural = 'Stamp Applications'

    def save(self, *args, **kwargs):
        # Auto-generate reference number on first save
        if not self.reference_number:
            year = timezone.now().strftime('%Y')
            super().save(*args, **kwargs)
            self.reference_number = f"KCCP-{year}-{self.pk:05d}"
            kwargs['update_fields'] = ['reference_number']
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_number} | {self.applicant} | {self.status}"


class StampRecord(models.Model):
    """An officially issued stamp linked to an approved application."""

    application = models.OneToOneField(
        StampApplication, on_delete=models.CASCADE, related_name='stamp_record'
    )
    stamp_number = models.CharField(max_length=100, unique=True)
    issued_by = models.CharField(max_length=255)
    issued_at = models.DateTimeField(auto_now_add=True)
    valid_from = models.DateField()
    valid_until = models.DateField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)
    revocation_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Stamp #{self.stamp_number} – {self.application.reference_number}"


class AuditLog(models.Model):
    """Append-only log of every status change or action taken."""

    ACTION_CHOICES = [
        ('created', 'Created'),
        ('submitted', 'Submitted'),
        ('status_changed', 'Status Changed'),
        ('document_uploaded', 'Document Uploaded'),
        ('payment_recorded', 'Payment Recorded'),
        ('stamp_issued', 'Stamp Issued'),
        ('stamp_revoked', 'Stamp Revoked'),
        ('note_added', 'Note Added'),
    ]

    application = models.ForeignKey(
        StampApplication, on_delete=models.CASCADE, related_name='audit_logs'
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    performed_by = models.CharField(max_length=255, default='system')
    old_value = models.CharField(max_length=255, blank=True)
    new_value = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.application.reference_number} | {self.action} @ {self.timestamp:%Y-%m-%d %H:%M}"
