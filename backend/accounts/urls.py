from django.urls import path
from . import views

urlpatterns = [
    # Auth / Profile
    path('me/', views.me, name='user-profile'),

    # Super Admin → Manage RMs
    path('managers/', views.ManagerListCreateView.as_view(), name='manager-list-create'),

    # RM → Manage Customers
    path('customers/', views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:customer_id>/accounts/',
         views.rm_customer_accounts, name='rm-customer-accounts'),

    # Customer → Accounts & Transactions
    path('accounts/', views.AccountListView.as_view(), name='account-list'),
    path('transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('deposit/', views.deposit, name='deposit'),
    path('withdraw/', views.withdraw, name='withdraw'),

    # Customer → Service Requests
    path('services/', views.ServiceRequestListCreateView.as_view(), name='service-list-create'),

    # Dashboard
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),

    # Admin → All Customers
    path('all-customers/', views.AllCustomersListView.as_view(), name='all-customers'),
]
