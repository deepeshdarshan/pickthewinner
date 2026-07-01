/**
 * @fileoverview SPA router service — History API navigation, guards, and page loading.
 * @module services/router.service
 */

import { ROUTES, findRouteByPath, normalizePath } from '../config/routes.js';
import { appSettings } from '../config/app.config.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { updateAppShell } from './layout.service.js';
import { renderErrorState } from '../components/error-state.component.js';
import { Logger } from '../utils/logger.util.js';
import { canActivate } from '../auth/auth.guard.js';
import { canActivateUserRoute } from '../users/user.guard.js';
import { canActivateRoleRoute } from '../authorization/role.guard.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { AUTHORIZATION_ROUTES } from '../authorization/permission.constants.js';
import { isAuthenticated } from '../auth/auth.service.js';

/** @type {((path: string) => void)|null} */
let onRouteChange = null;

/** @type {string} */
let currentPath = '/';

/** @type {boolean} */
let routerReady = false;

/**
 * Registers a callback invoked after each successful navigation.
 * @param {(path: string) => void} callback
 * @returns {void}
 */
export function onNavigate(callback) {
  onRouteChange = callback;
}

/**
 * Returns the current normalized path.
 * @returns {string}
 */
export function getCurrentPath() {
  return currentPath;
}

/**
 * Returns whether the router has completed initial navigation.
 * @returns {boolean}
 */
export function isRouterReady() {
  return routerReady;
}

/**
 * @typedef {Object} GuardEvaluation
 * @property {boolean} allowed
 * @property {string} [redirectTo]
 * @property {boolean} [replace]
 */

/**
 * Runs the guard pipeline for a route.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<GuardEvaluation>}
 */
export async function evaluateRouteGuards(route) {
  const guards = [canActivate, canActivateUserRoute, canActivateRoleRoute];

  for (const guard of guards) {
    const result = await guard(route);

    if (!result.allowed) {
      return {
        allowed: false,
        redirectTo: result.redirectTo,
        replace: result.replace ?? true,
      };
    }
  }

  return { allowed: true };
}

/**
 * Checks whether the current session can access a route.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<boolean>}
 */
export async function canAccessRoute(route) {
  const result = await evaluateRouteGuards(route);
  return result.allowed;
}

/**
 * Navigates to a path without reloading the page.
 * @param {string} path
 * @param {boolean} [replace=false]
 * @returns {Promise<void>}
 */
export async function navigateTo(path, replace = false) {
  const [pathOnly, query = ''] = path.split('?');
  const normalized = normalizePath(pathOnly);
  const route = findRouteByPath(normalized);
  const fullPath = query ? `${normalized}?${query}` : normalized;

  if (!route) {
    await renderNotFound(normalized, fullPath, replace);
    return;
  }

  const guardResult = await evaluateRouteGuards(route);

  if (!guardResult.allowed && guardResult.redirectTo) {
    await navigateTo(guardResult.redirectTo, guardResult.replace ?? true);
    return;
  }

  const currentSearch = window.location.search;
  const targetSearch = query ? `?${query}` : '';

  if (normalized === currentPath && targetSearch === currentSearch && !replace) {
    return;
  }

  if (replace) {
    window.history.replaceState({ path: fullPath }, '', fullPath);
  } else {
    window.history.pushState({ path: fullPath }, '', fullPath);
  }

  await loadRoute(route, fullPath);
}

/**
 * Initializes the router and loads the initial page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
export async function initRouter(outlet) {
  document.addEventListener('click', handleLinkClick);
  window.addEventListener('popstate', handlePopState);

  const initialPath = `${window.location.pathname}${window.location.search}`;
  const pathOnly = normalizePath(window.location.pathname);
  let route = findRouteByPath(pathOnly);

  if (!route) {
    await renderNotFound(pathOnly, initialPath, true, outlet);
    routerReady = true;
    return;
  }

  const guardResult = await evaluateRouteGuards(route);

  if (!guardResult.allowed && guardResult.redirectTo) {
    const redirectRoute = findRouteByPath(normalizePath(guardResult.redirectTo));

    if (redirectRoute) {
      window.history.replaceState({ path: guardResult.redirectTo }, '', guardResult.redirectTo);
      await loadRoute(redirectRoute, guardResult.redirectTo, outlet);
      routerReady = true;
      return;
    }
  }

  await loadRoute(route, initialPath, outlet);
  routerReady = true;
}

/**
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleLinkClick(event) {
  const target = /** @type {HTMLElement|null} */ (
    event.target instanceof Element ? event.target.closest('[data-route]') : null
  );

  if (!target || target.tagName !== 'A') {
    return;
  }

  const href = target.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('#')) {
    return;
  }

  event.preventDefault();
  void navigateTo(href);
}

/**
 * @returns {void}
 */
function handlePopState() {
  const fullPath = `${window.location.pathname}${window.location.search}`;
  const pathOnly = normalizePath(window.location.pathname);
  const route = findRouteByPath(pathOnly);

  if (!route) {
    void renderNotFound(pathOnly, fullPath, true);
    return;
  }

  void (async () => {
    const guardResult = await evaluateRouteGuards(route);

    if (!guardResult.allowed && guardResult.redirectTo) {
      await navigateTo(guardResult.redirectTo, true);
      return;
    }

    await loadRoute(route, fullPath);
  })();
}

/**
 * @param {string} pathOnly
 * @param {string} fullPath
 * @param {boolean} [replace=false]
 * @param {HTMLElement} [outlet]
 * @returns {Promise<void>}
 */
async function renderNotFound(pathOnly, fullPath, replace = false, outlet) {
  const pageOutlet = outlet ?? document.getElementById('ptw-page-outlet');

  if (!pageOutlet) {
    return;
  }

  const notFoundPath = AUTHORIZATION_ROUTES.NOT_FOUND;
  const notFoundRoute = findRouteByPath(notFoundPath);

  if (replace) {
    window.history.replaceState({ path: notFoundPath }, '', notFoundPath);
  }

  currentPath = notFoundPath;

  if (notFoundRoute) {
    await loadRoute(notFoundRoute, notFoundPath, pageOutlet);
    return;
  }

  showLoadingOverlay();

  try {
    const notFoundModule = await import('../pages/not-found.page.js');
    document.title = `404 | ${appSettings.appName}`;
    updateAppShell(notFoundPath);
    notFoundModule.render(pageOutlet, pathOnly);

    if (onRouteChange) {
      onRouteChange(notFoundPath);
    }
  } catch (err) {
    Logger.error('Failed to load 404 page:', err);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {import('../config/routes.js').RouteDefinition} route
 * @param {string} path
 * @param {HTMLElement} [outlet]
 * @returns {Promise<void>}
 */
async function loadRoute(route, path, outlet) {
  const pageOutlet = outlet ?? document.getElementById('ptw-page-outlet');

  if (!pageOutlet) {
    return;
  }

  const pathOnly = normalizePath(path.split('?')[0]);
  currentPath = pathOnly;
  showLoadingOverlay();

  try {
    const pageModule = await import(route.pageModule);
    document.title = `${route.title} | ${appSettings.appName}`;

    updateAppShell(pathOnly);

    if (typeof pageModule.render === 'function') {
      pageModule.render(pageOutlet);
    } else if (typeof pageModule.init === 'function') {
      await pageModule.init(pageOutlet);
    }

    pageOutlet.focus({ preventScroll: true });

    if (onRouteChange) {
      onRouteChange(pathOnly);
    }
  } catch (err) {
    Logger.error('Failed to load page:', route.name, err);
    pageOutlet.innerHTML = `
      <div class="container ptw-page-content">
        <div class="card ptw-card">
          <div class="card-body">
            ${renderErrorState({
              title: 'Page unavailable',
              message: 'Unable to load this page. Please try again later.',
              actionHtml: '<a class="btn btn-ptw-primary mt-3" href="/" data-route>Return Home</a>',
            })}
          </div>
        </div>
      </div>
    `;
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @returns {string}
 */
export function getDefaultGuestRoute() {
  return isAuthenticated() ? AUTH_ROUTES.DASHBOARD : AUTH_ROUTES.LOGIN;
}
