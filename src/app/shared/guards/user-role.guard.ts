import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { JwtAuthService } from "../services/auth/jwt-auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UserRole } from "../models/user-role.model";

@Injectable({
  providedIn: 'root'
})
export class UserRoleGuard implements CanActivate {
  constructor(
    private router: Router, 
    private jwtAuth: JwtAuthService, 
    private snack: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const user = this.jwtAuth.getUser();

    if (!user || !user.role) {
      this.snack.open('Please log in to access this page!', 'OK', { duration: 3000 });
      this.router.navigate(['/sessions/signin']);
      return false;
    }

    // If no role restrictions specified, allow access
    if (!route.data || !route.data['roles']) {
      return true;
    }

    const allowedRoles: string[] = route.data['roles'];
    
    // Check if user's role is in the allowed roles
    if (allowedRoles.includes(user.role)) {
      return true;
    } else {
      this.snack.open(
        `Access denied! This page requires ${allowedRoles.join(' or ')} role.`, 
        'OK', 
        { duration: 5000 }
      );
      
      // Redirect to appropriate dashboard based on role
      this.redirectToDefaultPage(user.role);
      return false;
    }
  }

  private redirectToDefaultPage(role: string) {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
      case UserRole.VENDOR:
        this.router.navigate(['/dashboard/inventory']);
        break;
      case UserRole.ACCOUNTANT:
        this.router.navigate(['/accounting/dashboard']);
        break;
      default:
        this.router.navigate(['/sessions/signin']);
    }
  }
}
