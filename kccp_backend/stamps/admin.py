from django.contrib import admin
from .models import (
    StampType, Applicant, StampApplication, StampRecord,
    Business, FraudReport, ScamAlert, AuditLog,
    BusinessProfile, ProfileFraudReport, BusinessNotification,
)


# ── Inline: Audit Log inside StampApplication ─────────────────────────────────

class AuditLogInline(admin.TabularInline):
    model = AuditLog
    extra = 0
    readonly_fields = ['action', 'performed_by', 'old_value', 'new_value', 'note', 'timestamp']
    can_delete = False


# ── Inline: ProfileFraudReport inside BusinessProfile ────────────────────────

class ProfileFraudReportInline(admin.TabularInline):
    model = ProfileFraudReport
    extra = 0
    readonly_fields = [
        'report_type', 'severity_category', 'severity_score',
        'status', 'is_anonymous', 'created_at',
    ]
    can_delete = False


# ── Inline: BusinessNotification inside BusinessProfile ──────────────────────

class BusinessNotificationInline(admin.TabularInline):
    model = BusinessNotification
    extra = 0
    readonly_fields = ['title', 'type', 'is_read', 'created_at']
    can_delete = False


# ── StampType ─────────────────────────────────────────────────────────────────

@admin.register(StampType)
class StampTypeAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'fee', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['name', 'code']


# ── Applicant ─────────────────────────────────────────────────────────────────

@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display  = ['full_name', 'applicant_type', 'id_number', 'email', 'phone']
    list_filter   = ['applicant_type']
    search_fields = ['full_name', 'id_number', 'email']


# ── StampApplication ──────────────────────────────────────────────────────────

@admin.register(StampApplication)
class StampApplicationAdmin(admin.ModelAdmin):
    list_display   = [
        'reference_number', 'applicant', 'stamp_type',
        'status', 'priority', 'fee_paid', 'created_at',
    ]
    list_filter    = ['status', 'priority', 'fee_paid', 'stamp_type']
    search_fields  = ['reference_number', 'applicant__full_name', 'applicant__id_number']
    readonly_fields = ['reference_number', 'created_at', 'updated_at']
    inlines        = [AuditLogInline]


# ── StampRecord ───────────────────────────────────────────────────────────────

@admin.register(StampRecord)
class StampRecordAdmin(admin.ModelAdmin):
    list_display  = ['stamp_number', 'application', 'issued_by', 'issued_at', 'is_revoked']
    list_filter   = ['is_revoked']
    search_fields = ['stamp_number', 'application__reference_number']


# ── AuditLog ──────────────────────────────────────────────────────────────────

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display   = ['application', 'action', 'performed_by', 'old_value', 'new_value', 'timestamp']
    list_filter    = ['action']
    readonly_fields = ['timestamp']


# ── Business ──────────────────────────────────────────────────────────────────

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display  = ['name', 'handle', 'badge', 'category', 'county', 'verified_year', 'is_active']
    list_filter   = ['badge', 'category', 'is_active']
    search_fields = ['name', 'handle', 'reg_number']


# ── FraudReport (legacy CharField-based) ─────────────────────────────────────

@admin.register(FraudReport)
class FraudReportAdmin(admin.ModelAdmin):
    list_display  = ['business', 'report_type', 'severity', 'status', 'is_public', 'created_at']
    list_filter   = ['severity', 'status', 'report_type', 'is_public']
    search_fields = ['business', 'description']


# ── ScamAlert ─────────────────────────────────────────────────────────────────

@admin.register(ScamAlert)
class ScamAlertAdmin(admin.ModelAdmin):
    list_display  = ['title', 'alert_type', 'location', 'date', 'is_active']
    list_filter   = ['alert_type', 'is_active']
    search_fields = ['title', 'description']


# ── BusinessProfile ───────────────────────────────────────────────────────────

@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display   = [
        'business_name', 'business_handle', 'category',
        'county', 'is_verified', 'badge_status', 'created_at',
    ]
    list_filter    = ['is_verified', 'badge_status', 'category']
    search_fields  = ['business_name', 'business_handle', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines        = [ProfileFraudReportInline, BusinessNotificationInline]


# ── ProfileFraudReport ────────────────────────────────────────────────────────

@admin.register(ProfileFraudReport)
class ProfileFraudReportAdmin(admin.ModelAdmin):
    list_display   = [
        'business', 'report_type', 'severity_category',
        'severity_score', 'status', 'is_anonymous', 'created_at',
    ]
    list_filter    = ['severity_category', 'status', 'report_type', 'is_anonymous']
    search_fields  = ['business__business_name', 'description']
    readonly_fields = ['severity_category', 'severity_score', 'created_at']


# ── BusinessNotification ──────────────────────────────────────────────────────

@admin.register(BusinessNotification)
class BusinessNotificationAdmin(admin.ModelAdmin):
    list_display  = ['business', 'title', 'type', 'is_read', 'created_at']
    list_filter   = ['type', 'is_read']
    search_fields = ['business__business_name', 'title', 'message']
    readonly_fields = ['created_at']