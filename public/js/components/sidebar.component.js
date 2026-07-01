/**
 * @fileoverview Admin sidebar component — collapsible navigation placeholder.
 * @module components/sidebar.component
 */

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
export const ADMIN_SIDEBAR_ITEMS = Object.freeze([
  { path: '/admin', label: 'Overview', icon: 'bi-speedometer2' },
  { path: '/admin/tournaments', label: 'Tournaments', icon: 'bi-calendar-event' },
  { path: '/admin/matches', label: 'Matches', icon: 'bi-flag' },
  { path: '/admin/results', label: 'Results', icon: 'bi-clipboard-check' },
  { path: '/admin/users', label: 'Users', icon: 'bi-people' },
  { path: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
]);

/**
 * @typedef {Object} SidebarOptions
 * @property {string} [activePath]
 * @property {boolean} [collapsed]
 */

/**
 * Renders the admin sidebar navigation.
 * @param {SidebarOptions} [options]
 * @returns {string}
 */
export function renderSidebar(options = {}) {
  const { activePath = '/admin', collapsed = false } = options;

  const navItems = ADMIN_SIDEBAR_ITEMS.map(({ path, label, icon }) => {
    const isActive = activePath === path
      || (path !== '/admin' && activePath.startsWith(`${path}/`));

    return `
      <li class="nav-item">
        <a
          class="nav-link${isActive ? ' active' : ''}"
          href="${path}"
          data-route
          aria-current="${isActive ? 'page' : 'false'}"
        >
          <i class="bi ${icon} me-2" aria-hidden="true"></i>
          <span class="ptw-sidebar__label">${label}</span>
        </a>
      </li>
    `;
  }).join('');

  return `
    <aside class="ptw-sidebar${collapsed ? ' ptw-sidebar--collapsed' : ''}" aria-label="Admin navigation">
      <div class="ptw-sidebar__header d-flex justify-content-between align-items-center">
        <span class="ptw-sidebar__title">
          <i class="bi bi-shield-lock me-2" aria-hidden="true"></i>
          Admin
        </span>
        <button
          type="button"
          class="btn btn-sm btn-link ptw-sidebar__toggle d-none d-lg-inline-flex"
          data-ptw-sidebar-toggle
          aria-expanded="${!collapsed}"
          aria-label="Toggle sidebar"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
      </div>
      <nav class="collapse show" id="ptwSidebarNav">
        <ul class="nav flex-column gap-1">
          ${navItems}
        </ul>
      </nav>
    </aside>
  `;
}

/**
 * Mounts the sidebar into a container element.
 * @param {HTMLElement} container
 * @param {SidebarOptions} [options]
 * @returns {void}
 */
export function mountSidebar(container, options = {}) {
  container.innerHTML = renderSidebar(options);
  bindSidebarToggle(container);
}

/**
 * Returns whether the current path should show the admin sidebar.
 * @param {string} path
 * @returns {boolean}
 */
export function isAdminPath(path) {
  return path === '/admin' || path.startsWith('/admin/');
}

/**
 * @param {HTMLElement} container
 * @returns {void}
 */
function bindSidebarToggle(container) {
  const toggle = container.querySelector('[data-ptw-sidebar-toggle]');
  const sidebar = container.querySelector('.ptw-sidebar');

  if (!toggle || !sidebar) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('ptw-sidebar--collapsed');
    toggle.setAttribute('aria-expanded', String(!isCollapsed));
    const icon = toggle.querySelector('i');

    if (icon) {
      icon.className = isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
    }
  });
}
