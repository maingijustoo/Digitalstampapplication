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
from django.contrib.auth.models import User


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
        is_new = self.pk is None
        if is_new:
            # First save: let Django assign a PK (strip force_insert so second save works)
            kwargs.pop('force_insert', None)
            kwargs.pop('update_fields', None)
            super().save(*args, **kwargs)
            # Now set the reference number and update only that column
            year = timezone.now().strftime('%Y')
            self.reference_number = f"KCCP-{year}-{self.pk:05d}"
            super().save(update_fields=['reference_number'])
        else:
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


class Business(models.Model):
    """A registered business with a KCPP trust badge."""

    BADGE_CHOICES = [
        ('verified',  'Verified'),
        ('pending',   'Pending'),
        ('at-risk',   'At Risk'),
        ('flagged',   'Flagged'),
        ('unverified','Unverified'),
    ]

    name            = models.CharField(max_length=255)
    handle          = models.CharField(max_length=100, unique=True, help_text='@handle or domain')
    website         = models.URLField(blank=True)
    category        = models.CharField(max_length=100, blank=True)
    county          = models.CharField(max_length=100, blank=True)
    description     = models.TextField(blank=True)
    reg_number      = models.CharField(max_length=100, blank=True)
    mpesa_paybill   = models.CharField(max_length=50, blank=True)
    year_established= models.PositiveIntegerField(null=True, blank=True)
    has_physical_address = models.BooleanField(default=False)
    badge           = models.CharField(max_length=20, choices=BADGE_CHOICES, default='unverified')
    verified_year   = models.PositiveIntegerField(null=True, blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    # Link to the applicant who registered this business
    applicant       = models.OneToOneField(
        Applicant, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='business'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Businesses'

    def __str__(self):
        return f"{self.name} ({self.badge})"


class FraudReport(models.Model):
    """A public fraud report submitted by a consumer."""

    SEVERITY_CHOICES = [
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
    ]
    STATUS_CHOICES = [
        ('pending',       'Pending'),
        ('investigating', 'Investigating'),
        ('resolved',      'Resolved'),
    ]
    TYPE_CHOICES = [
        ('Non-delivery',         'Non-delivery'),
        ('Fake Products',        'Fake Products'),
        ('Payment Fraud',        'Payment Fraud'),
        ('Identity Theft',       'Identity Theft'),
        ('Investment Scam',      'Investment Scam'),
        ('Phishing',             'Phishing'),
        ('Impersonation',        'Impersonation'),
        ('Other',                'Other'),
    ]

    business        = models.CharField(max_length=255, help_text='Business name or handle reported')
    report_type     = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Other')
    severity        = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description     = models.TextField()
    amount_lost     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    location        = models.CharField(max_length=255, blank=True)
    evidence_url    = models.URLField(blank=True)
    reporter_email  = models.EmailField(blank=True, help_text='Optional – for follow-up only')
    is_public       = models.BooleanField(default=True, help_text='Show anonymised on public feed')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.business} – {self.report_type} ({self.severity})"


class ScamAlert(models.Model):
    """An official KCCP-published scam alert."""

    TYPE_CHOICES = [
        ('Investment Scam',  'Investment Scam'),
        ('Online Shopping',  'Online Shopping'),
        ('Job Scam',         'Job Scam'),
        ('Romance Scam',     'Romance Scam'),
        ('Crypto Fraud',     'Crypto Fraud'),
        ('M-Pesa Fraud',     'M-Pesa Fraud'),
        ('Phishing',         'Phishing'),
        ('Other',            'Other'),
    ]

    title           = models.CharField(max_length=255)
    alert_type      = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Other')
    description     = models.TextField()
    location        = models.CharField(max_length=255, blank=True)
    date            = models.DateField()
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.alert_type} – {self.title}"


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
    
class BusinessProfile(models.Model):
    """
    Authenticated business owner profile — linked to Django's User model.
    Separate from the public Business directory record.
    """
    CATEGORY_CHOICES = [
        ('retail',      'Retail'),
        ('food',        'Food & Beverage'),
        ('tech',        'Technology'),
        ('finance',     'Finance'),
        ('health',      'Health & Wellness'),
        ('logistics',   'Logistics'),
        ('other',       'Other'),
    ]

    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name='business_profile')
    business_name    = models.CharField(max_length=255)
    business_handle  = models.CharField(max_length=100, unique=True, help_text='Unique @handle')
    category         = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    county           = models.CharField(max_length=100, blank=True)
    description      = models.TextField(blank=True)
    mpesa_paybill    = models.CharField(max_length=50, blank=True)
    phone            = models.CharField(max_length=30, blank=True)
    website          = models.URLField(blank=True)
    is_verified      = models.BooleanField(default=False, help_text='True when a digital stamp has been issued')
    badge_status     = models.CharField(max_length=20, default='unverified')  # used by admin flagging
    certificate_id   = models.CharField(max_length=100, blank=True, null=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Business Profile'

    def __str__(self):
        return f"{self.business_name} (@{self.business_handle})"

    @property
    def current_trust_score(self):
        """
        Algorithm A: Dynamic Trust Score Calculation.
        Base → 100 if verified, else 60.
        Active report penalty: score * 0.5 per unresolved report.
        Resolution bonus: +20 per resolved report.
        Time-based recovery: +10 per full 3-week block since last report (if > 21 days ago).
        Ceiling: 0–100.
        """
        score = 100.0 if self.is_verified else 60.0

        # Hard-lock flagged businesses at 0
        if self.badge_status == 'flagged':
            return 0

        reports = self.fraud_reports.all()

        active_reports   = reports.filter(status__in=['open', 'investigating'])
        resolved_reports = reports.filter(status='resolved')

        # Active report penalty
        for _ in active_reports:
            score *= 0.5

        # Resolution bonus
        score += resolved_reports.count() * 20

        # Time-based recovery
        latest_report = reports.order_by('-created_at').first()
        if latest_report is None:
            # No reports ever — add recovery based on account age
            days_since = (timezone.now() - self.created_at).days
        else:
            days_since = (timezone.now() - latest_report.created_at).days

        if days_since >= 21:
            full_blocks = days_since // 21
            score += full_blocks * 10

        # Enforce ceiling and floor
        return max(0, min(100, round(score)))


class ProfileFraudReport(models.Model):
    """
    A fraud report filed against a BusinessProfile (authenticated system).
    Distinct from the legacy FraudReport model which stores business as a CharField.
    """
    STATUS_CHOICES = [
        ('open',          'Open'),
        ('investigating', 'Investigating'),
        ('resolved',      'Resolved'),
    ]
    SEVERITY_CHOICES = [
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
    ]
    TYPE_CHOICES = [
        ('Non-delivery',    'Non-delivery'),
        ('Fake Products',   'Fake Products'),
        ('Payment Fraud',   'Payment Fraud'),
        ('Identity Theft',  'Identity Theft'),
        ('Investment Scam', 'Investment Scam'),
        ('Phishing',        'Phishing'),
        ('Impersonation',   'Impersonation'),
        ('Other',           'Other'),
    ]

    HIGH_RISK_KEYWORDS = [
        'stolen', 'money', 'fake', 'scam', 'never delivered',
        'mpesa', 'con', 'fraud', 'cheat', 'lie', 'missing',
    ]

    business         = models.ForeignKey(
        BusinessProfile, on_delete=models.CASCADE, related_name='fraud_reports'
    )
    report_type      = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Other')
    location         = models.CharField(max_length=255, blank=True)
    description      = models.TextField()
    is_anonymous     = models.BooleanField(default=False)
    reporter_phone   = models.CharField(max_length=30, blank=True, null=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    severity_category = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    severity_score   = models.IntegerField(default=0)
    created_at       = models.DateTimeField(auto_now_add=True)
    resolved_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Profile Fraud Report'

    def __str__(self):
        return f"{self.business.business_name} – {self.report_type} ({self.severity_category})"

    def save(self, *args, **kwargs):
        """
        Algorithm B: Automated Severity Categorization.
        Runs on every save to keep severity current.
        """
        description_lower = self.description.lower()

        base_score = 30
        for keyword in self.HIGH_RISK_KEYWORDS:
            if keyword in description_lower:
                base_score += 20

        # Anonymity modifier — anonymous reports carry less weight
        if self.is_anonymous:
            base_score = int(base_score * 0.7)

        self.severity_score = base_score

        if base_score >= 75:
            self.severity_category = 'high'
        elif base_score >= 40:
            self.severity_category = 'medium'
        else:
            self.severity_category = 'low'

        # Set resolved_at timestamp when status flips to resolved
        if self.status == 'resolved' and self.resolved_at is None:
            self.resolved_at = timezone.now()

        super().save(*args, **kwargs)


class BusinessNotification(models.Model):
    """Notifications sent to a business owner via their portal."""

    TYPE_CHOICES = [
        ('stamp_approved', 'Stamp Approved'),
        ('stamp_renewal',  'Stamp Renewal Due'),
        ('new_report',     'New Fraud Report'),
        ('system',         'System Message'),
    ]

    business   = models.ForeignKey(
        BusinessProfile, on_delete=models.CASCADE, related_name='notifications'
    )
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Business Notification'

    def __str__(self):
        return f"[{self.type}] {self.title} → {self.business.business_name}"