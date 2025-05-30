import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5051/api/Auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenKey = 'auth_token';

  constructor(
    private router: Router, 
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only check localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Check if user is already logged in (from localStorage)
      const token = localStorage.getItem(this.tokenKey);
      const user = localStorage.getItem('currentUser');
      if (token && user) {
        this.currentUserSubject.next(JSON.parse(user));
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response && response.success) {
          // Check if email verification is required
          if (response.requiresEmailVerification) {
            // Navigate to email verification page
            this.router.navigate(['/auth/verify-email'], { queryParams: { email: email } });
            return response;
          }
          
          // Store token and user info (only in browser)
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem('currentUser', JSON.stringify({
              userId: response.userId,
              username: response.username,
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
              roles: response.roles,
              isEmailVerified: response.isEmailVerified
            }));
          }
          
          this.currentUserSubject.next({
            userId: response.userId,
            username: response.username,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            roles: response.roles,
            isEmailVerified: response.isEmailVerified
          });
          this.isAuthenticatedSubject.next(true);
          this.router.navigate(['/workspace']);
        }
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(email: string, password: string, firstName: string, lastName: string, username: string): Observable<any> {
    const registerData = {
      firstName,
      lastName,
      email,
      username,
      password,
      confirmPassword: password
    };
    
    return this.http.post<any>(`${this.apiUrl}/register`, registerData).pipe(
      tap(response => {
        if (response && response.success) {
          // Check if email verification is required
          if (response.requiresEmailVerification) {
            // Navigate to email verification page
            this.router.navigate(['/auth/verify-email'], { queryParams: { email: email } });
          } else {
            // Store token and user info (only in browser)
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.tokenKey, response.token);
              localStorage.setItem('currentUser', JSON.stringify({
                userId: response.userId,
                username: response.username,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                roles: response.roles,
                isEmailVerified: response.isEmailVerified
              }));
            }
            
            this.currentUserSubject.next({
              userId: response.userId,
              username: response.username,
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
              roles: response.roles,
              isEmailVerified: response.isEmailVerified
            });
            this.isAuthenticatedSubject.next(true);
            this.router.navigate(['/workspace']);
          }
        }
        return response;
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/signin']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }
  
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
  
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verify email with verification code
   * @param email User's email address
   * @param verificationCode 6-digit verification code
   * @returns Observable with verification result
   */
  verifyEmail(email: string, verificationCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-email`, { email, verificationCode }).pipe(
      tap(response => {
        if (response && response.success) {
          // If verification is successful, update the user info with verified status
          if (response.token) {
            // Store new token (only in browser)
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.tokenKey, response.token);
            }
          }
        }
        return response;
      }),
      catchError(error => {
        console.error('Email verification error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resend verification code to user's email
   * @param email User's email address
   * @returns Observable with resend result
   */
  resendVerificationCode(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification`, { email }).pipe(
      catchError(error => {
        console.error('Resend verification code error:', error);
        return throwError(() => error);
      })
    );
  }
}
