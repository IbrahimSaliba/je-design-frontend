// User Role Constants
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
  ACCOUNTANT = 'ACCOUNTANT'
}

export const UserRoleId = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  VENDOR: 3,
  ACCOUNTANT: 4
};

// Role-based page access configuration
export const RolePageAccess = {
  // Dashboard pages
  'dashboard/inventory': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  'enhanced-items': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Entity pages
  'cruds/containers': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  'cruds/items': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  'cruds/clients': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  'cruds/suppliers': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Accounting pages
  'accounting/dashboard': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  'accounting/expenses': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  'accounting/accounting-entry': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  
  // Invoice pages
  'invoice/invoices': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Stock alerts
  'stock-alerts': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Shop/Order pages
  'shop': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Calendar
  'calendar': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
  
  // Profile (all users)
  'profile/overview': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT],
  'profile/settings': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT],
  
  // Others (admin only)
  'others/users': [UserRole.SUPER_ADMIN] // Only super admin can manage users
};

// Helper function to check if user has access to a page
export function hasPageAccess(userRole: string, page: string): boolean {
  const allowedRoles = RolePageAccess[page];
  if (!allowedRoles) {
    // If page not configured, allow SUPER_ADMIN and ADMIN by default
    return userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN;
  }
  return allowedRoles.includes(userRole as UserRole);
}

// Helper function to get role display name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Administrator';
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.VENDOR:
      return 'Vendor';
    case UserRole.ACCOUNTANT:
      return 'Accountant';
    default:
      return 'Unknown Role';
  }
}

