import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface UserDialogData {
  user: any;
  mode: 'view' | 'edit' | 'new';
}

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css'],
  standalone: false
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  isEditMode: boolean = false;
  public profilePhoto: string | null = null;
  public saving: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private http: HttpClient,
    private jwtAuth: JwtAuthService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = data.mode === 'edit' || data.mode === 'new';
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', Validators.required],
      language: ['ENGLISH', Validators.required],
      last_login: [''],
      last_name: ['', Validators.required],
      roleId: [null, Validators.required], // Changed from 'role' to 'roleId'
      two_factor_auth: ['N', Validators.required],
      user_status: ['ACTIVE', Validators.required], // Changed to 'ACTIVE'
      username: ['', Validators.required],
      password: [''], // Only for new users
      phone: [''],
      address: [''],
      bio: [''],
      registered: ['']
    });

    // Add password validator for new users
    if (data.mode === 'new') {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(3)]);
    }

    // Populate form with user data
    if (data.user) {
      this.userForm.patchValue({
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        language: data.user.language || 'ENGLISH',
        last_login: data.user.last_login,
        roleId: data.user.roleId,
        two_factor_auth: data.user.two_factor_auth || 'N',
        user_status: data.user.user_status || 'ACTIVE',
        username: data.user.username,
        phone: data.user.phone,
        address: data.user.address,
        bio: data.user.bio,
        registered: data.user.registered
      });
    }
    
    // Set profile photo if user has one
    if (data.user.photo || data.user.picture) {
      this.profilePhoto = data.user.photo || data.user.picture;
    }
  }

  ngOnInit(): void {
    // Disable form if in view mode
    if (!this.isEditMode) {
      this.userForm.disable();
    }
  }

  getDialogTitle(): string {
    switch (this.data.mode) {
      case 'new': return 'New User';
      case 'edit': return 'Edit User';
      case 'view': return 'View User';
      default: return 'User';
    }
  }

  getDialogIcon(): string {
    switch (this.data.mode) {
      case 'new': return 'person_add';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'person';
    }
  }

  getDisplayName(): string {
    const firstName = this.userForm.get('first_name')?.value || '';
    const lastName = this.userForm.get('last_name')?.value || '';
    return `${firstName} ${lastName}`.trim() || this.data.user.name || 'User';
  }

  getStatusColor(status: string): string {
    return status === 'active' ? 'primary' : 'warn';
  }

  getStatusDisplay(status: string): string {
    return status === 'active' ? 'Active' : 'Disactivated';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userForm.valid && this.isEditMode) {
      this.saving = true;
      const token = this.jwtAuth.getJwtToken();
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      if (this.data.mode === 'new') {
        // Create new user
        const createData = {
          username: this.userForm.get('username')?.value,
          password: this.userForm.get('password')?.value,
          email: this.userForm.get('email')?.value,
          roleId: this.userForm.get('roleId')?.value,
          firstName: this.userForm.get('first_name')?.value,
          lastName: this.userForm.get('last_name')?.value,
          language: this.userForm.get('language')?.value,
          twoFactorAuth: this.userForm.get('two_factor_auth')?.value,
          userStatus: this.userForm.get('user_status')?.value,
          picture: this.profilePhoto,
          bio: this.userForm.get('bio')?.value,
          phone: this.userForm.get('phone')?.value,
          address: this.userForm.get('address')?.value
        };

        this.http.post<any>('http://localhost:8080/api/users', createData, { headers })
          .subscribe({
            next: (response) => {
              this.saving = false;
              if (response.errorCode === '000000') {
                this.snackBar.open('User created successfully!', 'OK', { duration: 3000 });
                this.dialogRef.close({ success: true });
              } else {
                this.snackBar.open(response.errorDescription || 'Error creating user', 'OK', { duration: 3000 });
              }
            },
            error: (error) => {
              this.saving = false;
              console.error('Error creating user:', error);
              this.snackBar.open('Error creating user', 'OK', { duration: 3000 });
            }
          });
      } else {
        // Update existing user
        const updateData = {
          email: this.userForm.get('email')?.value,
          roleId: this.userForm.get('roleId')?.value,
          firstName: this.userForm.get('first_name')?.value,
          lastName: this.userForm.get('last_name')?.value,
          language: this.userForm.get('language')?.value,
          twoFactorAuth: this.userForm.get('two_factor_auth')?.value,
          userStatus: this.userForm.get('user_status')?.value,
          picture: this.profilePhoto,
          bio: this.userForm.get('bio')?.value,
          phone: this.userForm.get('phone')?.value,
          address: this.userForm.get('address')?.value
        };

        this.http.put<any>(`http://localhost:8080/api/users/${this.data.user.id}`, updateData, { headers })
          .subscribe({
            next: (response) => {
              this.saving = false;
              if (response.errorCode === '000000') {
                this.snackBar.open('User updated successfully!', 'OK', { duration: 3000 });
                this.dialogRef.close({ success: true });
              } else {
                this.snackBar.open(response.errorDescription || 'Error updating user', 'OK', { duration: 3000 });
              }
            },
            error: (error) => {
              this.saving = false;
              console.error('Error updating user:', error);
              this.snackBar.open('Error updating user', 'OK', { duration: 3000 });
            }
          });
      }
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        alert('Please select a valid image file (JPG, PNG, or GIF)');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhoto = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getSaveButtonText(): string {
    return this.data.mode === 'new' ? 'Create User' : 'Save Changes';
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return '';
  }
}
