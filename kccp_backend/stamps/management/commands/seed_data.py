"""
Management command: python manage.py seed_data
Seeds initial StampType records and a test applicant.
"""

from django.core.management.base import BaseCommand
from stamps.models import StampType, Applicant


STAMP_TYPES = [
    {'code': 'CERT-GOOD', 'name': 'Certificate of Good Standing', 'fee': 2000.00},
    {'code': 'CERT-REG',  'name': 'Certificate of Registration',   'fee': 3500.00},
    {'code': 'STAMP-OFF', 'name': 'Official Government Stamp',      'fee': 500.00},
    {'code': 'CERT-COMP', 'name': 'Company Compliance Certificate', 'fee': 5000.00},
    {'code': 'STAMP-AUTH','name': 'Authentication Stamp',           'fee': 1500.00},
    {'code': 'CERT-TAX',  'name': 'Tax Clearance Certificate',      'fee': 0.00},
    {'code': 'STAMP-CUS', 'name': 'Customs Clearance Stamp',        'fee': 1000.00},
]


class Command(BaseCommand):
    help = 'Seed initial data for the KCCP stamp application'

    def handle(self, *args, **options):
        created = 0
        for st in STAMP_TYPES:
            obj, is_new = StampType.objects.get_or_create(
                code=st['code'],
                defaults={'name': st['name'], 'fee': st['fee'], 'is_active': True}
            )
            if is_new:
                created += 1
                self.stdout.write(f'  ✓ Created stamp type: {obj.name}')
            else:
                self.stdout.write(f'  – Already exists: {obj.name}')

        # Test applicant
        applicant, is_new = Applicant.objects.get_or_create(
            id_number='12345678',
            defaults={
                'full_name': 'Test Applicant',
                'email': 'test@example.com',
                'phone': '+254700000000',
                'applicant_type': 'individual',
            }
        )
        if is_new:
            self.stdout.write(f'  ✓ Created test applicant: {applicant.full_name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created {created} stamp type(s).'
        ))
