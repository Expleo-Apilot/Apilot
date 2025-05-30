import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  verificationForm: FormGroup;
  email: string = '';
  isSubmitting = false;
  errorMessage = '';
  countdown = 0;
  canResend = true;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.verificationForm = this.formBuilder.group({
      verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get email from route params or query params
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });

    // If no email is provided, redirect to signup
    if (!this.email) {
      this.router.navigate(['/auth/signup']);
    }
  }

  onSubmit(): void {
    if (this.verificationForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const verificationCode = this.verificationForm.get('verificationCode')?.value;

    this.authService.verifyEmail(this.email, verificationCode).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.snackBar.open('Email verified successfully! You can now log in.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/auth/signin']);
        } else {
          this.errorMessage = response.message || 'Verification failed. Please try again.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
        console.error('Verification error:', error);
      }
    });
  }

  resendCode(): void {
    if (!this.canResend) {
      return;
    }

    this.canResend = false;
    this.countdown = 180; // 3 minutes in seconds

    this.authService.resendVerificationCode(this.email).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Verification code resent. Please check your email.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          // Start countdown timer
          const timer = setInterval(() => {
            this.countdown--;
            if (this.countdown <= 0) {
              this.canResend = true;
              clearInterval(timer);
            }
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Failed to resend verification code.';
          this.canResend = true;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to resend verification code.';
        console.error('Resend verification error:', error);
        this.canResend = true;
      }
    });
  }

  goToSignin(): void {
    this.router.navigate(['/auth/signin']);
  }

  formatCountdown(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}
