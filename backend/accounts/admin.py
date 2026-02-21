from django.contrib.admin import AdminSite
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Account, Transaction, ServiceRequest


# Custom Admin Site branding
admin.site.site_header = '🏦 Subbu Bank Administration'
admin.site.site_title = 'Subbu Bank Admin'
admin.site.index_title = 'Welcome to Subbu Bank Admin Panel'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Bank Role', {'fields': ('role', 'phone', 'address', 'created_by')}),
    )


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'user', 'account_type', 'balance', 'is_active', 'created_at']
    list_filter = ['account_type', 'is_active']
    search_fields = ['account_number', 'user__username']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_id', 'account', 'transaction_type', 'amount', 'balance_after', 'timestamp']
    list_filter = ['transaction_type']
    search_fields = ['reference_id', 'description']


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'service_type', 'status', 'created_at', 'updated_at']
    list_filter = ['service_type', 'status']
    search_fields = ['user__username']
