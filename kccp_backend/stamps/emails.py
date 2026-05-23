"""
KCCP Email Utility
Handles all outbound emails from the platform.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_stamp_issued_email(
    to_email: str,
    business_name: str,
    username: str,
    one_time_password: str,
    stamp_number: str,
):
    """
    Sent to a business when their digital stamp is issued.
    Contains their portal login credentials.
    """
    subject = "🏷 Your KCCP Digital Trust Stamp Has Been Issued!"

    message = f"""
Dear {business_name},

Congratulations! Your KCCP Digital Trust Stamp has been successfully issued.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAMP DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stamp Number : {stamp_number}
Status       : Verified ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR PORTAL LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal URL       : http://localhost:5173/business-portal
Username         : {username}
One-Time Password: {one_time_password}

⚠️  IMPORTANT: This is a one-time password.
Please log in and change it immediately under Settings → Change Password.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU CAN DO IN YOUR PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- View your live Trust Score
- Monitor fraud reports filed against your business
- Receive official KCCP notifications
- Manage your account settings

If you did not apply for this stamp or believe this email was sent
in error, please contact KCCP support immediately.

Regards,
The KCCP Team
Kenya Consumer Protection Platform
    """.strip()

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log the error but don't crash the stamp issuance flow
        print(f"[KCCP Email Error] Failed to send to {to_email}: {e}")
        return False


def send_flagged_email(
    to_email: str,
    business_name: str,
    reason: str,
):
    """Sent to a business when their account is flagged by an admin."""
    subject = "⚠️ Your KCCP Business Account Has Been Flagged"

    message = f"""
Dear {business_name},

Your KCCP business account has been flagged by our moderation team.

Reason: {reason}

As a result:
- Your Digital Trust Stamp has been suspended
- Your trust score has been set to 0
- Your business will show as "Flagged" in public searches

If you believe this is an error, please contact KCCP support
with any supporting documentation to appeal this decision.

Regards,
The KCCP Team
Kenya Consumer Protection Platform
    """.strip()

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"[KCCP Email Error] Failed to send to {to_email}: {e}")
        return False


def send_report_notification_email(
    to_email: str,
    business_name: str,
    report_type: str,
    severity: str,
):
    """Sent to a business when a new fraud report is filed against them."""
    subject = "📋 New Fraud Report Filed Against Your Business"

    message = f"""
Dear {business_name},

A new fraud report has been filed against your business on the
KCCP platform.

Report Type : {report_type}
Severity    : {severity.upper()}

Log in to your business portal to view the full details
and respond if necessary.

Portal: http://localhost:5173/business-portal

Regards,
The KCCP Team
Kenya Consumer Protection Platform
    """.strip()

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"[KCCP Email Error] Failed to send to {to_email}: {e}")
        return False