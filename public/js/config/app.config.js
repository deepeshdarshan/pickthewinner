/**
 * @fileoverview Application configuration — Firebase and runtime settings.
 * @module config/app.config
 */

import { environment } from './environment.js';

/**
 * Firebase project configuration.
 * @type {import('firebase/app').FirebaseOptions}
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCfncK3rvaY1BBbKZ9RjyTOfsszAb3E-Ws',
  authDomain: 'pickthewinner-8affb.firebaseapp.com',
  projectId: 'pickthewinner-8affb',
  storageBucket: 'pickthewinner-8affb.firebasestorage.app',
  messagingSenderId: '712171489513',
  appId: '1:712171489513:web:18c1a511e7fb8fe4dbc878',
  measurementId: 'G-Y5L9KLKZE0',
};

/**
 * Application metadata and runtime settings.
 * @type {Readonly<{
 *   appName: string,
 *   appTagline: string,
 *   version: string,
 *   defaultRoute: string,
 *   timezone: string,
 *   timezoneLabel: string,
 *   locale: string,
 *   defaultPredictionLockMinutes: number,
 *   dateFormat: string,
 *   dateTimeFormat: string,
 *   timeFormat: string,
 *   theme: string,
 *   toastDurationMs: number,
 *   pageTransitionMs: number,
 *   assets: { logo: string, favicon: string },
 *   supportContactPhone: string,
 *   environment: typeof environment
 * }>}
 */
export const appSettings = Object.freeze({
  appName: 'PickTheWinner',
  appTagline: 'Powered by Ernakulam Jilla Yuvavedi',
  supportContactPhone: '+91 9645588784',
  version: '1.0.0',
  defaultRoute: '/',
  timezone: 'Asia/Kolkata',
  timezoneLabel: 'IST (GMT+05:30)',
  locale: 'en-IN',
  defaultPredictionLockMinutes: 10,
  dateFormat: 'dd MMM yyyy',
  dateTimeFormat: 'dd MMM yyyy HH:mm',
  timeFormat: 'HH:mm',
  theme: 'dark',
  toastDurationMs: 4000,
  pageTransitionMs: 250,
  assets: {
    logo: '/assets/logos/logo.png',
    favicon: '/assets/logos/favicon.ico',
  },
  environment,
});
