export interface User {
  id?: string;
  displayName?: string;
  role?: string; // Role name: SUPER_ADMIN, ADMIN, VENDOR, ACCOUNTANT
  roleId?: number; // Role ID: 1, 2, 3, 4
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string; // Profile picture: file path or URL
  bio?: string; // User biography/description
  phone?: string; // Phone number
  address?: string; // User address
}