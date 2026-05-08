from django.contrib import admin
from .models import StampType, Applicant, StampApplication, StampRecord, AuditLog


@admin.register(StampType)
class StampTypeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'fee', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'applicant_type', 'id_number', 'email', 'phone']
    list_filter = ['applicant_type']
    search_fields = ['full_name', 'id_number', 'email']


class AuditLogInline(admin.TabularInline):
    model = AuditLog
    extra = 0
    readonly_fields = ['action', 'performed_by', 'old_value', 'new_value', 'note', 'timestamp']
    can_delete = False


@admin.register(StampApplication)
class StampApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'reference_number', 'applicant', 'stamp_type',
        'status', 'priority', 'fee_paid', 'created_at',
    ]
    list_filter = ['status', 'priority', 'fee_paid', 'stamp_type']
    search_fields = ['reference_number', 'applicant__full_name', 'applicant__id_number']
    readonly_fields = ['reference_number', 'created_at', 'updated_at']
    inlines = [AuditLogInline]


@admin.register(StampRecord)
class StampRecordAdmin(admin.ModelAdmin):
    list_display = ['stamp_number', 'application', 'issued_by', 'issued_at', 'is_revoked']
    list_filter = ['is_revoked']
    search_fields = ['stamp_number', 'application__reference_number']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['application', 'action', 'performed_by', 'old_value', 'new_value', 'timestamp']
    list_filter = ['action']
    readonly_fields = ['timestamp']
