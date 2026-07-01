/**
 * @fileoverview Pagination component using Bootstrap pagination.
 * @module components/pagination.component
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {string} [basePath]
 */

/**
 * Renders pagination controls.
 * @param {PaginationOptions} options
 * @returns {string}
 */
export function renderPagination(options) {
  const { currentPage, totalPages, basePath = '?' } = options;

  if (totalPages <= 1) {
    return '';
  }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((page) => {
      if (totalPages <= 7) {
        return true;
      }
      return page === 1
        || page === totalPages
        || Math.abs(page - currentPage) <= 1;
    })
    .map((page, index, arr) => {
      const prev = arr[index - 1];
      const ellipsis = prev && page - prev > 1
        ? '<li class="page-item disabled"><span class="page-link">…</span></li>'
        : '';

      const isActive = page === currentPage;
      return `
        ${ellipsis}
        <li class="page-item${isActive ? ' active' : ''}">
          <a class="page-link" href="${basePath}page=${page}" data-page="${page}"${isActive ? ' aria-current="page"' : ''}>${page}</a>
        </li>
      `;
    })
    .join('');

  return `
    <nav aria-label="Pagination">
      <ul class="pagination ptw-pagination justify-content-center mb-0">
        <li class="page-item${prevDisabled ? ' disabled' : ''}">
          <a class="page-link" href="${basePath}page=${currentPage - 1}" data-page="${currentPage - 1}" aria-label="Previous page"${prevDisabled ? ' tabindex="-1"' : ''}>
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </a>
        </li>
        ${pages}
        <li class="page-item${nextDisabled ? ' disabled' : ''}">
          <a class="page-link" href="${basePath}page=${currentPage + 1}" data-page="${currentPage + 1}" aria-label="Next page"${nextDisabled ? ' tabindex="-1"' : ''}>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </a>
        </li>
      </ul>
    </nav>
  `;
}

/**
 * Mounts pagination into a container element.
 * @param {HTMLElement} container
 * @param {PaginationOptions} options
 * @returns {void}
 */
export function mountPagination(container, options) {
  container.innerHTML = renderPagination(options);
}
