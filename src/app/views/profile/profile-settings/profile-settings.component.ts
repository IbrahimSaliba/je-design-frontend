import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-profile-settings',
    templateUrl: './profile-settings.component.html',
    styleUrls: ['./profile-settings.component.css'],
    standalone: false
})
export class ProfileSettingsComponent implements OnInit {
  public hasBaseDropZoneOver: boolean = false;
  public profilePhoto: string | null = null;
  public profileForm: FormGroup;
  public loading: boolean = false;
  public saving: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private jwtAuth: JwtAuthService,
    private snackBar: MatSnackBar
  ) {
    // Initialize form
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: [{value: '', disabled: true}], // Username is read-only
      firstName: [''],
      lastName: [''],
      bio: [''], // User biography
      phone: [''], // Phone number
      address: [''], // Address
      language: ['ENGLISH'],
      role: [{value: '', disabled: true}], // Role is read-only
      userStatus: [{value: '', disabled: true}], // Status is read-only
      twoFactorAuth: ['N'],
      lastLogin: [{value: '', disabled: true}] // Last login is read-only
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }
  
  loadUserProfile() {
    this.loading = true;
    const token = this.jwtAuth.getJwtToken(); // Use JwtAuthService to get token (properly parsed)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>('http://localhost:8080/api/auth/profile', { headers })
      .subscribe({
        next: (response: any) => {
          if (response.errorCode === "000000" && response.responseData) {
            const profile = response.responseData;
            
            // Set profile photo
            this.profilePhoto = profile.picture;
            
            // Patch form values
            this.profileForm.patchValue({
              email: profile.email || '',
              username: profile.username || '',
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              bio: profile.bio || '',
              phone: profile.phone || '',
              address: profile.address || '',
              language: profile.language || 'ENGLISH',
              role: profile.roleName || '',
              userStatus: 'ACTIVE',
              twoFactorAuth: profile.twoFactorAuth || 'N',
              lastLogin: profile.lastLogin || 'N/A'
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          
          // Check if it's an invalid token error
          if (error.status === 401 || error.status === 403 || 
              (error.error && error.error.errorCode === '000001')) {
            this.snackBar.open('Session expired. Please login again.', 'OK', { duration: 5000 });
            // Give user time to read the message, then redirect
            setTimeout(() => {
              this.jwtAuth.signout();
            }, 2000);
          } else {
            this.snackBar.open('Error loading profile data', 'OK', { duration: 3000 });
          }
          this.loading = false;
        }
      });
  }
  
  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('File size must be less than 2MB', 'OK', { duration: 3000 });
        return;
      }
      
      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        this.snackBar.open('Please select a valid image file (JPG, PNG, or GIF)', 'OK', { duration: 3000 });
        return;
      }
      
      // Create preview URL (Base64)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhoto = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  public saveChanges(): void {
    if (this.profileForm.invalid) {
      this.snackBar.open('Please fix form errors', 'OK', { duration: 3000 });
      return;
    }

    this.saving = true;
    const token = this.jwtAuth.getJwtToken(); // Use JwtAuthService to get token (properly parsed)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const updateData = {
      email: this.profileForm.get('email')?.value,
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      bio: this.profileForm.get('bio')?.value,
      phone: this.profileForm.get('phone')?.value,
      address: this.profileForm.get('address')?.value,
      language: this.profileForm.get('language')?.value,
      twoFactorAuth: this.profileForm.get('twoFactorAuth')?.value,
      picture: this.profilePhoto
    };

    this.http.put<any>('http://localhost:8080/api/auth/profile', updateData, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.errorCode === "000000") {
            // Update local user data
            const profile = response.responseData;
            const updatedUser = {
              id: profile.id?.toString(),
              displayName: profile.displayName || profile.username,
              role: profile.roleName,
              roleId: profile.roleId,
              username: profile.username,
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
              picture: profile.picture,
              bio: profile.bio,
              phone: profile.phone,
              address: profile.address
            };
            this.jwtAuth.setUserAndToken(token!, updatedUser, true);
            
            this.snackBar.open('Profile updated successfully!', 'OK', { duration: 3000 });
          } else {
            this.snackBar.open(response.errorDescription || 'Error updating profile', 'OK', { duration: 3000 });
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.snackBar.open('Error saving profile changes', 'OK', { duration: 3000 });
          this.saving = false;
        }
      });
  }

}
