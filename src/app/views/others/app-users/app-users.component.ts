import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-users',
    templateUrl: './app-users.component.html',
    styleUrls: ['./app-users.component.css'],
    standalone: false
})
export class AppUsersComponent implements OnInit {
  users: any[] = [];
  loading: boolean = false;
  
  // Old dummy data - removed
  dummyUsers = [
    {
      'name': 'Snow Benton',
      'status': 'active',
      'phone': '+1 (956) 486-2327',
      'photo': 'assets/images/face-1.jpg',
      'address': '329 Dictum Court, Minnesota',
      'registered': '2016-07-09'
    },
    {
      'name': 'Kay Sellers',
      'status': 'active',
      'phone': '+1 (929) 406-3172',
      'photo': 'assets/images/face-2.jpg',
      'address': '893 Garden Place, American Samoa',
      'registered': '2017-02-16'
    },
    {
      'name': 'Robert Middleton',
      'status': 'disactivated',
      'phone': '+1 (995) 451-2205',
      'photo': 'assets/images/face-3.jpg',
      'address': '301 Hazel Court, West Virginia',
      'registered': '2017-01-22'
    },
    {
      'name': 'Delaney Randall',
      'status': 'active',
      'phone': '+1 (922) 599-2410',
      'photo': 'assets/images/face-4.jpg',
      'address': '128 Kensington Walk, Ohio',
      'registered': '2016-12-08'
    },
    {
      'name': 'Melendez Lawrence',
      'status': 'active',
      'phone': '+1 (824) 589-2029',
      'photo': 'assets/images/face-5.jpg',
      'address': '370 Lincoln Avenue, Florida',
      'registered': '2015-03-29'
    },
    {
      'name': 'Galloway Fitzpatrick',
      'status': 'disactivated',
      'phone': '+1 (907) 477-2375',
      'photo': 'assets/images/face-6.jpg',
      'address': '296 Stuyvesant Avenue, Iowa',
      'registered': '2015-12-12'
    },
    {
      'name': 'Watson Joyce',
      'status': 'active',
      'phone': '+1 (982) 500-3137',
      'photo': 'assets/images/face-7.jpg',
      'address': '224 Visitation Place, Illinois',
      'registered': '2015-08-19'
    },
    {
      'name': 'Ada Kidd',
      'status': 'active',
      'phone': '+1 (832) 531-2385',
      'photo': 'assets/images/face-1.jpg',
      'address': '230 Oxford Street, South Dakota',
      'registered': '2016-08-11'
    },
    {
      'name': 'Raquel Mcintyre',
      'status': 'disactivated',
      'phone': '+1 (996) 443-2102',
      'photo': 'assets/images/face-2.jpg',
      'address': '393 Sullivan Street, Palau',
      'registered': '2014-09-03'
    },
    {
      'name': 'Juliette Hunter',
      'status': 'active',
      'phone': '+1 (876) 568-2964',
      'photo': 'assets/images/face-3.jpg',
      'address': '191 Stryker Court, New Jersey',
      'registered': '2017-01-18'
    },
    {
      'name': 'Workman Floyd',
      'status': 'active',
      'phone': '+1 (996) 481-2712',
      'photo': 'assets/images/face-4.jpg',
      'address': '350 Imlay Street, Utah',
      'registered': '2017-05-01'
    },
    {
      'name': 'Amanda Bean',
      'status': 'disactivated',
      'phone': '+1 (894) 512-3907',
      'photo': 'assets/images/face-5.jpg',
      'address': '254 Stockton Street, Vermont',
      'registered': '2014-08-30'
    }
  ]
  
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private jwtAuth: JwtAuthService
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    const token = this.jwtAuth.getJwtToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const filterDTO = {
      page: 0,
      pageSize: 100,
      sortBy: 'Descending',
      status: ''
    };

    this.http.post<any[]>('http://localhost:8080/api/users/filter', filterDTO, { headers })
      .subscribe({
        next: (usersResponse) => {
          console.log('Raw backend response:', usersResponse);
          
          // Map backend response to frontend format
          this.users = usersResponse.map(user => {
            const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
            const roleName = this.getRoleName(user.roleId);
            const backendStatus = (user.userStatus || 'ACTIVE').toUpperCase();
            
            const mappedUser = {
              id: user.id,
              name: displayName,
              status: backendStatus === 'ACTIVE' ? 'active' : 'disactivated',
              photo: user.picture || 'assets/images/face-1.jpg',
              registered: user.lastLogin || 'N/A',
              email: user.email || 'N/A',
              first_name: user.firstName || '',
              language: user.language || 'ENGLISH',
              last_login: user.lastLogin || 'Never',
              last_name: user.lastName || '',
              role: roleName,
              roleId: user.roleId,
              two_factor_auth: user.twoFactorAuth || 'N',
              user_status: user.userStatus || 'ACTIVE',
              username: user.username,
              bio: user.bio || '',
              picture: user.picture,
              phone: user.phone || 'N/A',
              address: user.address || 'N/A'
            };
            
            console.log(`Mapped user ${user.username}:`, {
              role: mappedUser.role,
              status: mappedUser.status,
              picture: mappedUser.picture ? 'Set' : 'Not set',
              bio: mappedUser.bio ? 'Set' : 'Not set'
            });
            
            return mappedUser;
          });
          this.loading = false;
          console.log(`✅ Loaded ${this.users.length} users (excluding current user)`);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  getRoleName(roleId: number): string {
    switch (roleId) {
      case 1: return 'SUPER_ADMIN';
      case 2: return 'ADMIN';
      case 3: return 'VENDOR';
      case 4: return 'ACCOUNTANT';
      default: return 'UNKNOWN';
    }
  }

  getStatusColor(status: string): string {
    return status === 'active' ? 'primary' : 'warn';
  }

  getStatusDisplay(status: string): string {
    return status === 'active' ? 'Active' : 'Disactivated';
  }

  viewUser(user: any): void {
    console.log('View user:', user);
    // For now, use edit dialog in view mode
    this.openUserDialog(user, 'view');
  }

  editUser(user: any): void {
    console.log('Edit user:', user);
    this.openUserDialog(user, 'edit');
  }

  openUserDialog(user: any, mode: 'view' | 'edit' | 'new'): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '95vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      data: { user: { ...user }, mode: mode }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Reload users from backend to get fresh data
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(user: any): void {
    const action = user.status === 'active' ? 'disactivate' : 'activate';
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    
    const dialogData: ConfirmationDialogData = {
      title: `${actionCapitalized} User`,
      message: `Are you sure you want to ${action} the user "${user.name}"?`,
      confirmText: actionCapitalized,
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Toggle status via backend
        const token = this.jwtAuth.getJwtToken();
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const newStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
        const updateData = { userStatus: newStatus };

        this.http.put<any>(`http://localhost:8080/api/users/${user.id}`, updateData, { headers })
          .subscribe({
            next: (response) => {
              if (response.errorCode === '000000') {
                const statusText = newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
                this.snackBar.open(`User "${user.name}" has been ${statusText}`, 'Close', { duration: 3000 });
                this.loadUsers(); // Reload to show updated status
              } else {
                this.snackBar.open('Error updating user status', 'Close', { duration: 3000 });
              }
            },
            error: (error) => {
              console.error('Error updating user status:', error);
              this.snackBar.open('Error updating user status', 'Close', { duration: 3000 });
            }
          });
      }
    });
  }

  deleteUser(user: any): void {
    // TODO: Implement delete user functionality
    console.log('Delete user:', user);
    // TODO: Show confirmation dialog and call API
    // this.userService.deleteUser(user.id).subscribe(() => {
    //   this.loadUsers(); // Reload users list
    // });
  }

  addNewUser(): void {
    console.log('Add new user');
    
    // Create empty user object for new user
    const newUser = {
      id: null,
      name: '',
      status: 'active',
      phone: '',
      photo: 'assets/images/face-1.jpg', // Default photo
      address: '',
      registered: new Date().toISOString().split('T')[0], // Today's date
      email: '',
      first_name: '',
      language: 'ENGLISH',
      last_login: '',
      last_name: '',
      roleId: 2, // Default to ADMIN
      two_factor_auth: 'N',
      user_status: 'ACTIVE',
      username: '',
      bio: '',
      picture: null
    };

    // Open dialog in new mode for new user
    this.openUserDialog(newUser, 'new');
  }

}
