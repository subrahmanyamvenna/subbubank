from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db import transaction

from .models import User, Account, Transaction, ServiceRequest
from .serializers import (
    UserSerializer, CreateUserSerializer,
    AccountSerializer, TransactionSerializer,
    ServiceRequestSerializer, DepositSerializer, WithdrawSerializer,
)
from .permissions import IsSuperAdmin, IsRelationshipManager, IsCustomer, IsSuperAdminOrRM


# ─── Current User Profile ──────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the authenticated user's profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ─── Super Admin: Manage Relationship Managers ──────────────────────
class ManagerListCreateView(generics.ListCreateAPIView):
    """Super Admin can list and create Relationship Managers."""
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(role='rm').order_by('-date_joined')

    def perform_create(self, serializer):
        serializer.save(role='rm', created_by=self.request.user)


# ─── RM: Manage Customers ──────────────────────────────────────────
class CustomerListCreateView(generics.ListCreateAPIView):
    """RM can list and create Customers assigned to them."""
    permission_classes = [IsRelationshipManager]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(
            role='customer', created_by=self.request.user
        ).order_by('-date_joined')

    def perform_create(self, serializer):
        user = serializer.save(role='customer', created_by=self.request.user)
        # Auto-create a savings account for the new customer
        import uuid
        Account.objects.create(
            user=user,
            account_number=f"SB{uuid.uuid4().hex[:10].upper()}",
            account_type='savings',
            balance=0.00,
        )


# ─── Customer: View Accounts ───────────────────────────────────────
class AccountListView(generics.ListAPIView):
    """Customer can view their own accounts."""
    serializer_class = AccountSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


# ─── Customer: View Transactions ───────────────────────────────────
class TransactionListView(generics.ListAPIView):
    """Customer can view their transaction statements."""
    serializer_class = TransactionSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        qs = Transaction.objects.filter(account__user=self.request.user)
        # Optional filters
        txn_type = self.request.query_params.get('type')
        if txn_type in ('credit', 'debit'):
            qs = qs.filter(transaction_type=txn_type)
        account_id = self.request.query_params.get('account')
        if account_id:
            qs = qs.filter(account_id=account_id)
        return qs


# ─── Customer: Service Requests ────────────────────────────────────
class ServiceRequestListCreateView(generics.ListCreateAPIView):
    """Customer can view and create service requests."""
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return ServiceRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── Dashboard Stats ───────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Return role-appropriate dashboard statistics."""
    user = request.user

    if user.role == 'superadmin':
        return Response({
            'total_rms': User.objects.filter(role='rm').count(),
            'total_customers': User.objects.filter(role='customer').count(),
            'total_accounts': Account.objects.count(),
            'total_balance': str(Account.objects.aggregate(
                total=Sum('balance'))['total'] or 0),
            'pending_services': ServiceRequest.objects.filter(
                status='pending').count(),
        })

    elif user.role == 'rm':
        customers = User.objects.filter(role='customer', created_by=user)
        customer_ids = customers.values_list('id', flat=True)
        return Response({
            'total_customers': customers.count(),
            'total_accounts': Account.objects.filter(
                user_id__in=customer_ids).count(),
            'total_balance': str(Account.objects.filter(
                user_id__in=customer_ids).aggregate(
                total=Sum('balance'))['total'] or 0),
            'pending_services': ServiceRequest.objects.filter(
                user_id__in=customer_ids, status='pending').count(),
        })

    elif user.role == 'customer':
        accounts = Account.objects.filter(user=user)
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or 0
        recent_txns = Transaction.objects.filter(
            account__user=user
        )[:5]
        return Response({
            'total_accounts': accounts.count(),
            'total_balance': str(total_balance),
            'recent_transactions': TransactionSerializer(recent_txns, many=True).data,
            'pending_services': ServiceRequest.objects.filter(
                user=user, status='pending').count(),
        })

    return Response({'detail': 'Unknown role'}, status=400)


# ─── Admin: All Customers (for super admin viewing) ────────────────
class AllCustomersListView(generics.ListAPIView):
    """Super Admin can see all customers."""
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return User.objects.filter(role='customer').order_by('-date_joined')


# ─── RM: View customer accounts ─────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsRelationshipManager])
def rm_customer_accounts(request, customer_id):
    """RM can view accounts of their assigned customers."""
    try:
        customer = User.objects.get(
            id=customer_id, role='customer', created_by=request.user
        )
    except User.DoesNotExist:
        return Response(
            {'detail': 'Customer not found or not assigned to you.'},
            status=404
        )
    accounts = Account.objects.filter(user=customer)
    serializer = AccountSerializer(accounts, many=True)
    return Response(serializer.data)


# ─── Customer: Deposit ──────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsCustomer])
def deposit(request):
    """Customer deposits money into their own account."""
    serializer = DepositSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    account_id = serializer.validated_data['account_id']
    amount = serializer.validated_data['amount']
    description = serializer.validated_data['description']

    try:
        account = Account.objects.get(id=account_id, user=request.user, is_active=True)
    except Account.DoesNotExist:
        return Response({'detail': 'Account not found or not active.'}, status=404)

    with transaction.atomic():
        account.balance += amount
        account.save()
        txn = Transaction.objects.create(
            account=account,
            transaction_type='credit',
            amount=amount,
            balance_after=account.balance,
            description=description,
        )
    return Response({
        'detail': f'₹{amount} deposited successfully.',
        'transaction': TransactionSerializer(txn).data,
        'new_balance': str(account.balance),
    })


# ─── Customer: Withdraw ─────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsCustomer])
def withdraw(request):
    """Customer withdraws money from their own account."""
    serializer = WithdrawSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    account_id = serializer.validated_data['account_id']
    amount = serializer.validated_data['amount']
    description = serializer.validated_data['description']

    try:
        account = Account.objects.get(id=account_id, user=request.user, is_active=True)
    except Account.DoesNotExist:
        return Response({'detail': 'Account not found or not active.'}, status=404)

    if account.balance < amount:
        return Response(
            {'detail': f'Insufficient balance. Available: ₹{account.balance}'},
            status=400
        )

    with transaction.atomic():
        account.balance -= amount
        account.save()
        txn = Transaction.objects.create(
            account=account,
            transaction_type='debit',
            amount=amount,
            balance_after=account.balance,
            description=description,
        )
    return Response({
        'detail': f'₹{amount} withdrawn successfully.',
        'transaction': TransactionSerializer(txn).data,
        'new_balance': str(account.balance),
    })
