from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Only allow super admins."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'superadmin'
        )


class IsRelationshipManager(BasePermission):
    """Only allow relationship managers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'rm'
        )


class IsCustomer(BasePermission):
    """Only allow customers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'customer'
        )


class IsSuperAdminOrRM(BasePermission):
    """Allow super admins or RMs."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('superadmin', 'rm')
        )
