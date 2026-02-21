"""
Seed script — populates the Subbu Bank database with dummy data.
Run: python manage.py shell < seed_data.py
  OR: python seed_data.py  (with Django settings configured)
"""
import os, sys, uuid, random
from decimal import Decimal
from datetime import timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'subbu_bank.settings')

import django
django.setup()

from django.utils import timezone
from accounts.models import User, Account, Transaction, ServiceRequest

print("🏦 Seeding Subbu Bank database...")

# ── 1. Super Admin ─────────────────────────────────────────────────
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'first_name': 'Subbu',
        'last_name': 'Admin',
        'email': 'admin@subbubank.com',
        'role': 'superadmin',
        'is_staff': True,
        'is_superuser': True,
    }
)
if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("  ✅ Super Admin created: admin / admin123")
else:
    print("  ⏩ Super Admin already exists")

# ── 2. Relationship Managers ───────────────────────────────────────
rm_data = [
    {'username': 'rm_priya', 'first_name': 'Priya', 'last_name': 'Sharma',
     'email': 'priya@subbubank.com', 'phone': '9876543210'},
    {'username': 'rm_kiran', 'first_name': 'Kiran', 'last_name': 'Reddy',
     'email': 'kiran@subbubank.com', 'phone': '9876543211'},
]

rms = []
for data in rm_data:
    rm, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'rm', 'created_by': admin_user}
    )
    if created:
        rm.set_password('rm123')
        rm.save()
        print(f"  ✅ RM created: {rm.username} / rm123")
    else:
        print(f"  ⏩ RM {rm.username} already exists")
    rms.append(rm)

# ── 3. Customers ───────────────────────────────────────────────────
customer_data = [
    {'username': 'cust_ravi', 'first_name': 'Ravi', 'last_name': 'Kumar',
     'email': 'ravi@email.com', 'phone': '9001234567',
     'address': '12, MG Road, Bangalore', 'rm': rms[0]},
    {'username': 'cust_anita', 'first_name': 'Anita', 'last_name': 'Desai',
     'email': 'anita@email.com', 'phone': '9001234568',
     'address': '45, Jubilee Hills, Hyderabad', 'rm': rms[0]},
    {'username': 'cust_arjun', 'first_name': 'Arjun', 'last_name': 'Nair',
     'email': 'arjun@email.com', 'phone': '9001234569',
     'address': '78, Anna Nagar, Chennai', 'rm': rms[0]},
    {'username': 'cust_meera', 'first_name': 'Meera', 'last_name': 'Patel',
     'email': 'meera@email.com', 'phone': '9001234570',
     'address': '23, SG Highway, Ahmedabad', 'rm': rms[1]},
    {'username': 'cust_rahul', 'first_name': 'Rahul', 'last_name': 'Verma',
     'email': 'rahul@email.com', 'phone': '9001234571',
     'address': '56, Connaught Place, Delhi', 'rm': rms[1]},
]

customers = []
for data in customer_data:
    rm = data.pop('rm')
    cust, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'customer', 'created_by': rm}
    )
    if created:
        cust.set_password('cust123')
        cust.save()
        print(f"  ✅ Customer created: {cust.username} / cust123")
    else:
        print(f"  ⏩ Customer {cust.username} already exists")
    customers.append(cust)

# ── 4. Accounts ────────────────────────────────────────────────────
account_types = ['savings', 'current', 'salary']
initial_balances = [25000, 150000, 48000, 320000, 12000]

for i, cust in enumerate(customers):
    if not Account.objects.filter(user=cust).exists():
        acc = Account.objects.create(
            user=cust,
            account_number=f"SB20250{str(i+1).zfill(5)}",
            account_type=account_types[i % len(account_types)],
            balance=Decimal(str(initial_balances[i])),
        )
        print(f"  ✅ Account created: {acc.account_number} (₹{acc.balance})")

        # Second account for some customers
        if i < 2:
            acc2 = Account.objects.create(
                user=cust,
                account_number=f"SB20250{str(i+10).zfill(5)}",
                account_type='current',
                balance=Decimal(str(random.randint(5000, 50000))),
            )
            print(f"  ✅ Second account created: {acc2.account_number}")
    else:
        print(f"  ⏩ Accounts for {cust.username} already exist")

# ── 5. Transactions ───────────────────────────────────────────────
descriptions_credit = [
    'Salary Credit', 'NEFT from John', 'UPI Credit', 'Cash Deposit',
    'Interest Credit', 'Refund - Amazon', 'Transfer from FD',
    'Cashback Reward', 'Dividend Credit',
]
descriptions_debit = [
    'ATM Withdrawal', 'Online Purchase - Flipkart', 'Electricity Bill',
    'Mobile Recharge', 'UPI to Swiggy', 'EMI Payment', 'Insurance Premium',
    'Grocery - BigBasket', 'Petrol Pump', 'Netflix Subscription',
]

txn_count = 0
for cust in customers:
    for acc in Account.objects.filter(user=cust):
        if Transaction.objects.filter(account=acc).exists():
            continue
        balance = acc.balance
        now = timezone.now()
        for j in range(random.randint(8, 15)):
            is_credit = random.choice([True, False])
            amount = Decimal(str(random.randint(200, 15000)))
            if is_credit:
                balance += amount
                desc = random.choice(descriptions_credit)
                txn_type = 'credit'
            else:
                if balance >= amount:
                    balance -= amount
                    desc = random.choice(descriptions_debit)
                    txn_type = 'debit'
                else:
                    continue
            Transaction.objects.create(
                account=acc,
                transaction_type=txn_type,
                amount=amount,
                balance_after=balance,
                description=desc,
                reference_id=f"TXN{uuid.uuid4().hex[:12].upper()}",
                timestamp=now - timedelta(days=random.randint(0, 90)),
            )
            txn_count += 1
        # Update account balance to final
        acc.balance = balance
        acc.save()

print(f"  ✅ Created {txn_count} transactions")

# ── 6. Service Requests ───────────────────────────────────────────
service_types = ['cheque_book', 'address_change', 'loan_enquiry',
                 'card_block', 'fd_opening', 'statement_request']
statuses = ['pending', 'in_progress', 'completed', 'rejected']

svc_count = 0
for cust in customers[:3]:
    if ServiceRequest.objects.filter(user=cust).exists():
        continue
    for _ in range(random.randint(1, 3)):
        ServiceRequest.objects.create(
            user=cust,
            service_type=random.choice(service_types),
            status=random.choice(statuses),
            remarks='Auto-generated dummy request',
        )
        svc_count += 1

print(f"  ✅ Created {svc_count} service requests")
print("\n🎉 Seeding complete! Subbu Bank is ready.")
print("\n  Login credentials:")
print("  ─────────────────────────────────────────")
print("  Super Admin  → admin / admin123")
print("  RM           → rm_priya / rm123")
print("  RM           → rm_kiran / rm123")
print("  Customer     → cust_ravi / cust123")
print("  Customer     → cust_anita / cust123")
print("  Customer     → cust_arjun / cust123")
print("  Customer     → cust_meera / cust123")
print("  Customer     → cust_rahul / cust123")
