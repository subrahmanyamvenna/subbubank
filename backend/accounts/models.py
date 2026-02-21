import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with role-based access."""
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('rm', 'Relationship Manager'),
        ('customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_users'
    )

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class Account(models.Model):
    """Bank account linked to a customer."""
    ACCOUNT_TYPES = [
        ('savings', 'Savings Account'),
        ('current', 'Current Account'),
        ('salary', 'Salary Account'),
    ]
    account_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='savings')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.account_number} - {self.user.username} (₹{self.balance})"

    def save(self, *args, **kwargs):
        if not self.account_number:
            self.account_number = f"SB{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class Transaction(models.Model):
    """A single financial transaction."""
    TRANSACTION_TYPES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255)
    reference_id = models.CharField(max_length=30, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.transaction_type.upper()} ₹{self.amount} | {self.description}"

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)


class ServiceRequest(models.Model):
    """Dummy banking service request."""
    SERVICE_TYPES = [
        ('cheque_book', 'New Cheque Book'),
        ('address_change', 'Address Change'),
        ('loan_enquiry', 'Loan Enquiry'),
        ('card_block', 'Block Debit Card'),
        ('fd_opening', 'Fixed Deposit Opening'),
        ('statement_request', 'Physical Statement Request'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_requests')
    service_type = models.CharField(max_length=30, choices=SERVICE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_service_type_display()} - {self.user.username} ({self.status})"
