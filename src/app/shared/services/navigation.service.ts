import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../models/user-role.model';

interface IMenuItem {
  type: 'link' | 'dropDown' | 'icon' | 'separator' | 'extLink';
  name?: string; // Used as display text for item and title for separator type
  state?: string; // Router state
  icon?: string; // Material icon name
  svgIcon?: string; // UI Lib icon name
  disabled?: boolean; // If true, item will not be appeared in sidenav.
  sub?: IChildItem[]; // Dropdown items
  badges?: IBadge[];
  roles?: UserRole[]; // Allowed roles for this menu item
}
interface IChildItem {
  type?: string;
  name: string; // Display text
  state?: string; // Router state
  icon?: string;  // Material icon name
  svgIcon?: string; // UI Lib icon name
  sub?: IChildItem[];
  roles?: UserRole[]; // Allowed roles for this menu item
}

interface IBadge {
  color: string; // primary/accent/warn/hex color codes(#fff000)
  value: string; // Display text
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  iconMenu: IMenuItem[] = [
    {
      name: 'DASHBOARD',
      type: 'dropDown',
      icon: 'dashboard',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Inventory Dashboard', state: 'dashboard/inventory', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Inventory Movements', state: 'enhanced-items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'Entities',
      type: 'dropDown',
      icon: 'list',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        {name: 'Containers', state: 'cruds/containers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Items', state: 'cruds/items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Clients', state: 'cruds/clients', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Suppliers', state: 'cruds/suppliers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]}
      ]
    },
    {
      name: 'Accounting',
      type: 'dropDown',
      icon: 'account_balance',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
      sub: [
        {name: 'Dashboard', state: 'accounting/dashboard', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
        {name: 'Expenses', state: 'accounting/expenses', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
        {name: 'Accounting Entry', state: 'accounting/accounting-entry', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
      ]
    },
    {
      name: 'Reports',
      type: 'link',
      icon: 'summarize',
      state: 'reports',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      name: 'Invoice',
      type: 'dropDown',
      icon: 'receipt',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Invoices', state: 'invoice/invoices', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Settlements', state: 'invoice/settlements', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
      ]
    },
    {
      name: 'Stock Alerts',
      type: 'link',
      icon: 'warning',
      state: 'stock-alerts',
      badges: [{ value: '0', color: 'warn' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Expiry Alerts',
      type: 'link',
      icon: 'event_busy',
      state: 'expiry-alerts',
      badges: [{ value: '0', color: 'accent' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Order',
      type: 'dropDown',
      icon: 'shopping_cart',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'PRODUCTS', state: 'shop', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'CALENDAR',
      type: 'link',
      icon: 'date_range',
      state: 'calendar',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'PROFILE',
      type: 'dropDown',
      icon: 'person',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT],
      sub: [
        { name: 'SETTINGS', state: 'profile/settings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT] }
      ]
    },
    {
      name: 'UTILITIES',
      type: 'dropDown',
      icon: 'widgets',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Client Distribution Map', state: 'utilities/distributions', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Audit Logs', state: 'utilities/audit-logs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      ]
    },
    {
      name: 'OTHERS',
      type: 'dropDown',
      icon: 'blur_on',
      roles: [UserRole.SUPER_ADMIN], // Only super admin
      sub: [
        { name: 'USERS', state: 'others/users', roles: [UserRole.SUPER_ADMIN] }
      ]
    }
  ];

  separatorMenu: IMenuItem[] = [
    {
      name: 'DASHBOARD',
      type: 'dropDown',
      icon: 'dashboard',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Inventory Dashboard', state: 'dashboard/inventory', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Inventory Movements', state: 'enhanced-items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'Entities',
      type: 'dropDown',
      icon: 'list',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        {name: 'Containers', state: 'cruds/containers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Items', state: 'cruds/items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Clients', state: 'cruds/clients', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Suppliers', state: 'cruds/suppliers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]}
      ]
    },
    {
      name: 'Invoice',
      type: 'dropDown',
      icon: 'receipt',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Invoices', state: 'invoice/invoices', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Settlements', state: 'invoice/settlements', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
      ]
    },
    {
      name: 'Stock Alerts',
      type: 'link',
      icon: 'warning',
      state: 'stock-alerts',
      badges: [{ value: '0', color: 'warn' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Expiry Alerts',
      type: 'link',
      icon: 'event_busy',
      state: 'expiry-alerts',
      badges: [{ value: '0', color: 'accent' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Order',
      type: 'dropDown',
      icon: 'shopping_cart',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'PRODUCTS', state: 'shop', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'CALENDAR',
      type: 'link',
      icon: 'date_range',
      state: 'calendar',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'PROFILE',
      type: 'dropDown',
      icon: 'person',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT],
      sub: [
        { name: 'SETTINGS', state: 'profile/settings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT] }
      ]
    },
    {
      name: 'UTILITIES',
      type: 'dropDown',
      icon: 'widgets',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Client Distribution Map', state: 'utilities/distributions', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Audit Logs', state: 'utilities/audit-logs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      ]
    },
    {
      name: 'OTHERS',
      type: 'dropDown',
      icon: 'blur_on',
      roles: [UserRole.SUPER_ADMIN], // Only super admin
      sub: [
        { name: 'USERS', state: 'others/users', roles: [UserRole.SUPER_ADMIN] }
      ]
    }
  ];

  plainMenu: IMenuItem[] = [
    {
      name: 'DASHBOARD',
      type: 'dropDown',
      icon: 'dashboard',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Inventory Dashboard', state: 'dashboard/inventory', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Inventory Movements', state: 'enhanced-items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'Entities',
      type: 'dropDown',
      icon: 'list',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        {name: 'Containers', state: 'cruds/containers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Items', state: 'cruds/items', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Clients', state: 'cruds/clients', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]},
        {name: 'Suppliers', state: 'cruds/suppliers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]}
      ]
    },
    {
      name: 'Accounting',
      type: 'dropDown',
      icon: 'account_balance',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
      sub: [
        {name: 'Dashboard', state: 'accounting/dashboard', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
        {name: 'Expenses', state: 'accounting/expenses', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
        {name: 'Accounting Entry', state: 'accounting/accounting-entry', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]},
      ]
    },
    {
      name: 'Invoice',
      type: 'dropDown',
      icon: 'receipt',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Invoices', state: 'invoice/invoices', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Settlements', state: 'invoice/settlements', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
      ]
    },
    {
      name: 'Stock Alerts',
      type: 'link',
      icon: 'warning',
      state: 'stock-alerts',
      badges: [{ value: '0', color: 'warn' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Expiry Alerts',
      type: 'link',
      icon: 'event_busy',
      state: 'expiry-alerts',
      badges: [{ value: '0', color: 'accent' }],
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'Order',
      type: 'dropDown',
      icon: 'shopping_cart',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'PRODUCTS', state: 'shop', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] }
      ]
    },
    {
      name: 'CALENDAR',
      type: 'link',
      icon: 'date_range',
      state: 'calendar',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR]
    },
    {
      name: 'PROFILE',
      type: 'dropDown',
      icon: 'person',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT],
      sub: [
        { name: 'SETTINGS', state: 'profile/settings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR, UserRole.ACCOUNTANT] }
      ]
    },
    {
      name: 'UTILITIES',
      type: 'dropDown',
      icon: 'widgets',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR],
      sub: [
        { name: 'Client Distribution Map', state: 'utilities/distributions', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VENDOR] },
        { name: 'Audit Logs', state: 'utilities/audit-logs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      ]
    },
    {
      name: 'OTHERS',
      type: 'dropDown',
      icon: 'blur_on',
      roles: [UserRole.SUPER_ADMIN], // Only super admin
      sub: [
        { name: 'USERS', state: 'others/users', roles: [UserRole.SUPER_ADMIN] }
      ]
    }
  ];

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle = 'Frequently Accessed';
  // sets iconMenu as default;
  menuItems = new BehaviorSubject<IMenuItem[]>(this.iconMenu);
  // navigation component has subscribed to this Observable
  menuItems$ = this.menuItems.asObservable();
  constructor() { 
    // Ensure the default menu is set correctly
    this.menuItems.next(this.iconMenu);
  }

  // Customizer component uses this method to change menu.
  // You can remove this method and customizer component.
  // Or you can customize this method to supply different menu for
  // different user type.
  publishNavigationChange(menuType: string) {
    switch (menuType) {
      case 'separator-menu':
        this.menuItems.next(this.separatorMenu);
        break;
      case 'icon-menu':
        this.menuItems.next(this.iconMenu);
        break;
      default:
        this.menuItems.next(this.plainMenu);
    }
  }
  
  // Filter menu items based on user role
  filterMenuByRole(menu: IMenuItem[], userRole: string): IMenuItem[] {
    if (!userRole) {
      return menu;
    }

    return menu
      .filter(item => {
        // If no roles specified, show to everyone
        if (!item.roles || item.roles.length === 0) {
          return true;
        }
        // Check if user's role is in the allowed roles
        return item.roles.includes(userRole as UserRole);
      })
      .map(item => {
        // If item has subitems, filter them too
        if (item.sub && item.sub.length > 0) {
          const filteredSub = item.sub.filter(subItem => {
            if (!subItem.roles || subItem.roles.length === 0) {
              return true;
            }
            return subItem.roles.includes(userRole as UserRole);
          });
          
          // Only return parent if it has visible subitems
          if (filteredSub.length > 0) {
            return { ...item, sub: filteredSub };
          }
          return null;
        }
        return item;
      })
      .filter(item => item !== null) as IMenuItem[];
  }

  // Publish navigation with role filtering
  publishNavigationChangeForRole(menuType: string, userRole: string) {
    let selectedMenu: IMenuItem[];
    
    switch (menuType) {
      case 'separator-menu':
        selectedMenu = this.separatorMenu;
        break;
      case 'icon-menu':
        selectedMenu = this.iconMenu;
        break;
      default:
        selectedMenu = this.plainMenu;
    }
    
    // Filter menu by user role
    const filteredMenu = this.filterMenuByRole(selectedMenu, userRole);
    this.menuItems.next(filteredMenu);
  }

  // Update Stock Alerts badge count
  updateStockAlertsBadge(count: number) {
    const updateBadge = (menu: IMenuItem[]) => {
      const stockAlertsItem = menu.find(item => item.state === 'stock-alerts');
      if (stockAlertsItem && stockAlertsItem.badges) {
        stockAlertsItem.badges[0].value = count.toString();
      }
    };
    
    // Update all menu types
    updateBadge(this.iconMenu);
    updateBadge(this.separatorMenu);
    updateBadge(this.plainMenu);
    
    // Publish the updated menu
    const currentMenu = this.menuItems.value;
    this.menuItems.next([...currentMenu]);
  }
  
  // Update Expiry Alerts badge count
  updateExpiryAlertsBadge(count: number) {
    const updateBadge = (menu: IMenuItem[]) => {
      const expiryAlertsItem = menu.find(item => item.state === 'expiry-alerts');
      if (expiryAlertsItem && expiryAlertsItem.badges) {
        expiryAlertsItem.badges[0].value = count.toString();
      }
    };
    
    // Update all menu types
    updateBadge(this.iconMenu);
    updateBadge(this.separatorMenu);
    updateBadge(this.plainMenu);
    
    // Publish the updated menu
    const currentMenu = this.menuItems.value;
    this.menuItems.next([...currentMenu]);
  }
}
