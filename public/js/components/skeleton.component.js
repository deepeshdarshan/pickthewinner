/**
 * @fileoverview Skeleton loading placeholders for cards and tables.
 * @module components/skeleton.component
 */

/**
 * Renders a skeleton card placeholder.
 * @returns {string}
 */
export function renderSkeletonCard() {
  return `
    <div class="card ptw-card ptw-skeleton-card" aria-hidden="true">
      <div class="card-body">
        <div class="ptw-skeleton ptw-skeleton--title"></div>
        <div class="ptw-skeleton ptw-skeleton--text"></div>
        <div class="ptw-skeleton ptw-skeleton--text ptw-skeleton--short"></div>
      </div>
    </div>
  `;
}

/**
 * Renders a grid of skeleton cards.
 * @param {number} [count=3]
 * @returns {string}
 */
export function renderSkeletonCardGrid(count = 3) {
  const cards = Array.from({ length: count }, () => `
    <div class="col-12 col-md-4">${renderSkeletonCard()}</div>
  `).join('');

  return `<div class="row g-3">${cards}</div>`;
}

/**
 * Renders a skeleton table placeholder.
 * @param {number} [rows=5]
 * @returns {string}
 */
export function renderSkeletonTable(rows = 5) {
  const bodyRows = Array.from({ length: rows }, () => `
    <tr>
      <td><div class="ptw-skeleton ptw-skeleton--cell"></div></td>
      <td><div class="ptw-skeleton ptw-skeleton--cell"></div></td>
      <td><div class="ptw-skeleton ptw-skeleton--cell ptw-skeleton--short"></div></td>
    </tr>
  `).join('');

  return `
    <div class="table-responsive ptw-skeleton-table" aria-hidden="true">
      <table class="table">
        <thead>
          <tr>
            <th scope="col"><div class="ptw-skeleton ptw-skeleton--cell"></div></th>
            <th scope="col"><div class="ptw-skeleton ptw-skeleton--cell"></div></th>
            <th scope="col"><div class="ptw-skeleton ptw-skeleton--cell"></div></th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

/**
 * Mounts skeleton cards into a container.
 * @param {HTMLElement} container
 * @param {number} [count=3]
 * @returns {void}
 */
export function mountSkeletonCards(container, count = 3) {
  container.innerHTML = renderSkeletonCardGrid(count);
}

/**
 * Mounts a skeleton table into a container.
 * @param {HTMLElement} container
 * @param {number} [rows=5]
 * @returns {void}
 */
export function mountSkeletonTable(container, rows = 5) {
  container.innerHTML = renderSkeletonTable(rows);
}
