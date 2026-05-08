"""
Management command: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from stamps.models import StampType, Applicant, Business, FraudReport, ScamAlert
import datetime

STAMP_TYPES = [
    {'code': 'CERT-GOOD', 'name': 'Certificate of Good Standing',  'fee': 2000.00},
    {'code': 'CERT-REG',  'name': 'Certificate of Registration',    'fee': 3500.00},
    {'code': 'STAMP-OFF', 'name': 'Official Government Stamp',       'fee': 500.00},
    {'code': 'CERT-COMP', 'name': 'Company Compliance Certificate',  'fee': 5000.00},
    {'code': 'STAMP-AUTH','name': 'Authentication Stamp',            'fee': 1500.00},
    {'code': 'CERT-TAX',  'name': 'Tax Clearance Certificate',       'fee': 0.00},
    {'code': 'STAMP-CUS', 'name': 'Customs Clearance Stamp',         'fee': 1000.00},
]

BUSINESSES = [
    {'name': 'Urban Trendy',       'handle': '@UrbanTrendy',    'category': 'Fashion & Retail',     'county': 'Nairobi',  'badge': 'verified',  'verified_year': 2023},
    {'name': 'TechHub Kenya',      'handle': '@TechHubKe',      'category': 'Technology',            'county': 'Nairobi',  'badge': 'verified',  'verified_year': 2022},
    {'name': 'Kili Organics',      'handle': 'kili.co.ke',      'category': 'Food & Grocery',        'county': 'Nakuru',   'badge': 'verified',  'verified_year': 2024},
    {'name': 'Safari Deals',       'handle': '@SafariDeals',    'category': 'Travel & Tourism',      'county': 'Mombasa',  'badge': 'verified',  'verified_year': 2023},
    {'name': 'QuickCash Loans',    'handle': '@QuickCashKe',    'category': 'Fintech / Mobile Money', 'county': 'Nairobi',  'badge': 'at-risk',   'verified_year': None},
    {'name': 'FakeGadgets254',     'handle': '@FakeGadgets254', 'category': 'E-Commerce',            'county': 'Kisumu',   'badge': 'flagged',   'verified_year': None},
    {'name': 'HealthPlus Pharmacy','handle': '@HealthPlusKe',   'category': 'Health & Wellness',     'county': 'Nairobi',  'badge': 'pending',   'verified_year': None},
    {'name': 'EduLearn Africa',    'handle': '@EduLearnAfrica', 'category': 'Education',             'county': 'Eldoret',  'badge': 'verified',  'verified_year': 2024},
]

FRAUD_REPORTS = [
    {'business': '@FakeGadgets254',   'report_type': 'Non-delivery',    'severity': 'high',   'status': 'investigating', 'description': 'Paid for laptop, never delivered.',             'location': 'Nairobi, Kenya'},
    {'business': 'QuickCash Loans',   'report_type': 'Investment Scam', 'severity': 'high',   'status': 'investigating', 'description': 'Promised 30% monthly returns, disappeared.',    'location': 'Nairobi, Kenya'},
    {'business': '@PhoneDeals254',    'report_type': 'Fake Products',   'severity': 'medium', 'status': 'pending',       'description': 'Received counterfeit iPhone instead of original.','location': 'Mombasa, Kenya'},
    {'business': 'Unknown Job Agency','report_type': 'Payment Fraud',   'severity': 'medium', 'status': 'resolved',      'description': 'Charged registration fee for fake job.',         'location': 'Kisumu, Kenya'},
    {'business': '@ClothingDeals',    'report_type': 'Non-delivery',    'severity': 'low',    'status': 'resolved',      'description': 'Items arrived 3 months late and damaged.',       'location': 'Nakuru, Kenya'},
]

SCAM_ALERTS = [
    {'title': 'Fake Investment Platform Targeting Kenyans',  'alert_type': 'Investment Scam', 'description': 'Fake platform promising 50% monthly returns circulating on WhatsApp.', 'location': 'Nairobi, Kenya',  'date': datetime.date(2025, 6, 10)},
    {'title': 'M-Pesa Reversal Scam on the Rise',            'alert_type': 'M-Pesa Fraud',   'description': 'Fraudsters calling victims claiming to have sent money by mistake.',    'location': 'Nationwide',      'date': datetime.date(2025, 5, 28)},
    {'title': 'Fake Online Shops Selling Counterfeit Goods', 'alert_type': 'Online Shopping','description': 'Fake Instagram shops selling branded goods at suspiciously low prices.', 'location': 'Mombasa, Kenya',  'date': datetime.date(2025, 5, 15)},
    {'title': 'Job Scam Targeting Fresh Graduates',          'alert_type': 'Job Scam',       'description': 'Fake agencies charging KES 5,000-15,000 for non-existent jobs.',        'location': 'Nationwide',      'date': datetime.date(2025, 4, 20)},
]


class Command(BaseCommand):
    help = 'Seed initial data for KCCP'

    def handle(self, *args, **options):
        self.stdout.write('\n── Stamp Types ──')
        for st in STAMP_TYPES:
            obj, new = StampType.objects.get_or_create(code=st['code'], defaults={'name': st['name'], 'fee': st['fee'], 'is_active': True})
            self.stdout.write(f"  {'created' if new else 'exists'}: {obj.name}")

        self.stdout.write('\n── Businesses ──')
        for b in BUSINESSES:
            obj, new = Business.objects.get_or_create(handle=b['handle'], defaults={**b})
            self.stdout.write(f"  {'created' if new else 'exists'}: {obj.name} [{obj.badge}]")

        self.stdout.write('\n── Fraud Reports ──')
        for r in FRAUD_REPORTS:
            obj, new = FraudReport.objects.get_or_create(
                business=r['business'], report_type=r['report_type'],
                defaults={**r, 'is_public': True}
            )
            self.stdout.write(f"  {'created' if new else 'exists'}: {obj.business}")

        self.stdout.write('\n── Scam Alerts ──')
        for a in SCAM_ALERTS:
            obj, new = ScamAlert.objects.get_or_create(title=a['title'], defaults={**a, 'is_active': True})
            self.stdout.write(f"  {'created' if new else 'exists'}: {obj.title}")

        Applicant.objects.get_or_create(id_number='12345678', defaults={
            'full_name': 'Test Applicant', 'email': 'test@example.com',
            'phone': '+254700000000', 'applicant_type': 'individual',
        })

        self.stdout.write(self.style.SUCCESS('\nSeed complete.'))
