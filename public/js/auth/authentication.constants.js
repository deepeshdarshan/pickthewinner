/**
 * @fileoverview Authentication constants — providers, routes, messages, and error codes.
 * @module auth/authentication.constants
 */

/** @enum {string} */
export const AUTH_EVENTS = Object.freeze({
  LOGIN_SUCCESS: 'auth:login-success',
  LOGIN_FAILED: 'auth:login-failed',
  LOGOUT: 'auth:logout',
  SESSION_RESTORED: 'auth:session-restored',
  SESSION_EXPIRED: 'auth:session-expired',
});

/** @enum {string} */
export const AUTH_PROVIDERS = Object.freeze({
  GOOGLE: 'google',
  EMAIL_PASSWORD: 'email_password',
});

/** @enum {string} */
export const AUTH_ROUTES = Object.freeze({
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  COMPLETE_PROFILE: '/complete-profile',
});

/** @type {Readonly<Record<string, string>>} */
export const AUTH_MESSAGES = Object.freeze({
  SIGNING_IN: 'Signing in…',
  SIGNING_OUT: 'Signing out…',
  RESTORING_SESSION: 'Restoring session…',
  LOGIN_SUCCESS: 'Signed in successfully.',
  LOGOUT_SUCCESS: 'Signed out successfully.',
  EMAIL_REQUIRED: 'Email is required.',
  PASSWORD_REQUIRED: 'Password is required.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  GOOGLE_CANCELLED: 'Google sign-in was cancelled.',
  POPUP_CLOSED: 'Sign-in popup was closed before completing.',
  POPUP_BLOCKED: 'Sign-in popup was blocked. Please allow popups and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
  AUTH_DISABLED: 'Authentication is currently unavailable.',
  GENERIC_ERROR: 'Unable to sign in. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
});

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * @type {Readonly<Record<string, string>>}
 */
export const FIREBASE_AUTH_ERROR_MESSAGES = Object.freeze({
  'auth/invalid-email': AUTH_MESSAGES.INVALID_CREDENTIALS,
  'auth/user-disabled': AUTH_MESSAGES.AUTH_DISABLED,
  'auth/user-not-found': AUTH_MESSAGES.INVALID_CREDENTIALS,
  'auth/wrong-password': AUTH_MESSAGES.INVALID_CREDENTIALS,
  'auth/invalid-credential': AUTH_MESSAGES.INVALID_CREDENTIALS,
  'auth/invalid-login-credentials': AUTH_MESSAGES.INVALID_CREDENTIALS,
  'auth/popup-closed-by-user': AUTH_MESSAGES.POPUP_CLOSED,
  'auth/cancelled-popup-request': AUTH_MESSAGES.GOOGLE_CANCELLED,
  'auth/popup-blocked': AUTH_MESSAGES.POPUP_BLOCKED,
  'auth/network-request-failed': AUTH_MESSAGES.NETWORK_ERROR,
  'auth/too-many-requests': AUTH_MESSAGES.TOO_MANY_REQUESTS,
  'auth/operation-not-allowed': AUTH_MESSAGES.AUTH_DISABLED,
});
