from rest_framework import serializers
from .models import User, Account, Transaction, ServiceRequest


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'role', 'phone', 'address', 'is_active',
                  'date_joined', 'created_by']
        read_only_fields = ['id', 'date_joined', 'created_by']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CreateUserSerializer(serializers.ModelSerializer):
    """Serializer for creating users (RM or Customer)."""
    password = serializers.CharField(write_only=True, min_length=4)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'password', 'role', 'phone', 'address']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for bank accounts."""
    account_type_display = serializers.CharField(
        source='get_account_type_display', read_only=True
    )

    class Meta:
        model = Account
        fields = ['id', 'account_number', 'account_type', 'account_type_display',
                  'balance', 'is_active', 'created_at']
        read_only_fields = ['id', 'account_number', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions."""
    account_number = serializers.CharField(source='account.account_number', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'account_number', 'transaction_type', 'amount',
                  'balance_after', 'description', 'reference_id', 'timestamp']
        read_only_fields = ['id', 'reference_id', 'timestamp']


class ServiceRequestSerializer(serializers.ModelSerializer):
    """Serializer for service requests."""
    service_type_display = serializers.CharField(
        source='get_service_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = ServiceRequest
        fields = ['id', 'service_type', 'service_type_display', 'status',
                  'status_display', 'remarks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class DepositSerializer(serializers.Serializer):
    """Serializer for deposit requests."""
    account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    description = serializers.CharField(max_length=255, required=False, default='Cash Deposit')


class WithdrawSerializer(serializers.Serializer):
    """Serializer for withdrawal requests."""
    account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    description = serializers.CharField(max_length=255, required=False, default='Cash Withdrawal')
