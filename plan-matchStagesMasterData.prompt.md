# Plan: Match Stages Master Data Module

Enable administrators to manage the match stage dropdown (Group Stage, Quarter Final, Semi Final, Final, etc.) through a dedicated Master Data page. Stages are stored in Firestore `match_stages` collection, loaded dynamically in the match creation form, and fall back to hardcoded defaults when no stages are configured yet.

---

## New Files to Create

```
public/js/master-data/match-stages/
  match-stage.constants.js
  match-stage.validator.js
  match-stage.service.js
  match-stage.renderer.js         ← barrel
  match-stages-admin.page.js
  renderers/
    list.renderer.js
    form.renderer.js
```

---

## 1. `match-stage.constants.js`

```javascript
import { FIRESTORE_COLLECTIONS } from '../../config/application.constants.js';

export const MATCH_STAGE_COLLECTIONS = Object.freeze({
  MATCH_STAGES: FIRESTORE_COLLECTIONS.MATCH_STAGES,
});

export const MATCH_STAGE_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/match-stages',
});

export const MATCH_STAGE_VALIDATION_MESSAGES = Object.freeze({
  LABEL_REQUIRED: 'Stage label is required.',
  LABEL_TOO_SHORT: 'Stage label must be at least 2 characters.',
  VALUE_REQUIRED: 'Stage key is required.',
  VALUE_INVALID: 'Stage key may only contain lowercase letters, numbers, and underscores.',
  SORT_ORDER_INVALID: 'Sort order must be a whole number >= 0.',
});

export const MATCH_STAGE_MESSAGES = Object.freeze({
  LOADING: 'Loading match stages…',
  LOADING_STAGE: 'Loading match stage…',
  CREATING: 'Creating match stage…',
  UPDATING: 'Updating match stage…',
  DELETING: 'Deleting match stage…',
  CREATED: 'Match stage created successfully.',
  UPDATED: 'Match stage updated successfully.',
  DELETED: 'Match stage deleted successfully.',
  NOT_FOUND: 'Match stage not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage match stages.',
  NO_STAGES: 'No match stages have been created yet.',
  CONFIRM_DELETE: 'Delete this match stage? Existing matches that reference it will continue to display the stored value.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

/** Hardcoded fallback used when Firestore has no stages configured yet. */
export const DEFAULT_MATCH_STAGES = Object.freeze([
  { label: 'Group Stage',   value: 'group_stage',   sortOrder: 10 },
  { label: 'Round of 32',   value: 'round_of_32',   sortOrder: 20 },
  { label: 'Round of 16',   value: 'round_of_16',   sortOrder: 30 },
  { label: 'Quarter Final', value: 'quarter_final', sortOrder: 40 },
  { label: 'Semi Final',    value: 'semi_final',    sortOrder: 50 },
  { label: 'Third Place',   value: 'third_place',   sortOrder: 55 },
  { label: 'Final',         value: 'final',         sortOrder: 60 },
]);

export function createDefaultMatchStageFields() {
  return { active: true, sortOrder: 10 };
}
```

---

## 2. `match-stage.validator.js`

```javascript
import { MATCH_STAGE_VALIDATION_MESSAGES, MATCH_STAGE_MESSAGES } from './match-stage.constants.js';

export function validateCreatePayload(payload) {
  const errors = {};

  const label = String(payload.label ?? '').trim();
  if (!label) errors.label = MATCH_STAGE_VALIDATION_MESSAGES.LABEL_REQUIRED;
  else if (label.length < 2) errors.label = MATCH_STAGE_VALIDATION_MESSAGES.LABEL_TOO_SHORT;

  const value = String(payload.value ?? '').trim();
  if (!value) errors.value = MATCH_STAGE_VALIDATION_MESSAGES.VALUE_REQUIRED;
  else if (!/^[a-z0-9_]+$/.test(value)) errors.value = MATCH_STAGE_VALIDATION_MESSAGES.VALUE_INVALID;

  if (payload.sortOrder !== undefined && payload.sortOrder !== '') {
    const n = Number(payload.sortOrder);
    if (!Number.isInteger(n) || n < 0) errors.sortOrder = MATCH_STAGE_VALIDATION_MESSAGES.SORT_ORDER_INVALID;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateUpdatePayload(payload) { return validateCreatePayload(payload); }

export function getStageValidationMessage(result) {
  if (result.valid) return '';
  return Object.values(result.errors)[0] ?? MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY;
}

export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  form.querySelectorAll('.ptw-invalid-feedback--visible').forEach((el) => {
    el.textContent = '';
    el.classList.remove('ptw-invalid-feedback--visible');
  });

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`) ?? form.querySelector(`#ptw-stage-${field}`);
    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
    const errorEl = form.querySelector(`#ptw-stage-${field}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });
}
```

---

## 3. `match-stage.service.js`

```javascript
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../../firebase/firebase.js';
import { getCurrentUser } from '../../auth/auth.service.js';
import {
  MATCH_STAGE_COLLECTIONS, MATCH_STAGE_MESSAGES, DEFAULT_MATCH_STAGES, createDefaultMatchStageFields,
} from './match-stage.constants.js';
import { validateCreatePayload, validateUpdatePayload, getStageValidationMessage } from './match-stage.validator.js';
import { Logger } from '../../utils/logger.util.js';

let listCache = null;

function getCollection() { return collection(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES); }

function normalizeDocument(id, data) {
  const defaults = createDefaultMatchStageFields();
  return {
    id,
    label: String(data.label ?? ''),
    value: String(data.value ?? ''),
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : Number(data.sortOrder ?? defaults.sortOrder),
    active: data.active !== false,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function clearMatchStageCache() { listCache = null; }

export function getMatchStageErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) return getStageValidationMessage(error.validation);
    if ('message' in error && Object.values(MATCH_STAGE_MESSAGES).includes(String(error.message))) return String(error.message);
    if ('code' in error && String(error.code) === 'permission-denied') return MATCH_STAGE_MESSAGES.PERMISSION_DENIED;
    Logger.error('[MatchStageService] Error:', error);
  }
  return MATCH_STAGE_MESSAGES.GENERIC_ERROR;
}

/**
 * Returns stages from Firestore sorted by sortOrder.
 * Falls back to DEFAULT_MATCH_STAGES when the collection is empty.
 */
export async function listMatchStages(options = {}) {
  const { activeOnly = false, forceRefresh = false } = options;
  if (!forceRefresh && listCache) return activeOnly ? listCache.filter((s) => s.active) : [...listCache];

  await ensureFirestoreOnline();
  const snapshot = await getDocs(query(getCollection(), orderBy('sortOrder', 'asc')));

  if (snapshot.empty) {
    const defaults = DEFAULT_MATCH_STAGES.map((s) => ({
      ...s, id: `default_${s.value}`, active: true,
      createdBy: '', updatedBy: '', createdAt: null, updatedAt: null,
    }));
    listCache = defaults;
    return activeOnly ? defaults.filter((s) => s.active) : [...defaults];
  }

  const stages = snapshot.docs.map((item) => normalizeDocument(item.id, item.data()));
  listCache = stages;
  return activeOnly ? stages.filter((s) => s.active) : stages;
}

export async function getMatchStageById(id) {
  if (!id) return null;
  await ensureFirestoreOnline();
  const snapshot = await getDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id));
  if (!snapshot.exists()) return null;
  return normalizeDocument(snapshot.id, snapshot.data());
}

export async function createMatchStage(payload) {
  const validation = validateCreatePayload(payload);
  if (!validation.valid) throw Object.assign(new Error(MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY), { validation });
  const user = getCurrentUser();
  if (!user) throw new Error(MATCH_STAGE_MESSAGES.PERMISSION_DENIED);
  await ensureFirestoreOnline();
  const data = {
    label: String(payload.label ?? '').trim(), value: String(payload.value ?? '').trim(),
    sortOrder: Number(payload.sortOrder ?? 10), active: payload.active !== false,
    createdBy: user.uid, updatedBy: user.uid,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(getCollection(), data);
  const stage = normalizeDocument(ref.id, { ...data, createdAt: new Date(), updatedAt: new Date() });
  listCache = null;
  return stage;
}

export async function updateMatchStage(id, payload) {
  const validation = validateUpdatePayload(payload);
  if (!validation.valid) throw Object.assign(new Error(MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY), { validation });
  const user = getCurrentUser();
  if (!user) throw new Error(MATCH_STAGE_MESSAGES.PERMISSION_DENIED);
  await ensureFirestoreOnline();
  const data = {
    label: String(payload.label ?? '').trim(), value: String(payload.value ?? '').trim(),
    sortOrder: Number(payload.sortOrder ?? 10), active: payload.active !== false,
    updatedBy: user.uid, updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id), data);
  listCache = null;
  const updated = await getMatchStageById(id);
  if (!updated) throw new Error(MATCH_STAGE_MESSAGES.NOT_FOUND);
  return updated;
}

export async function deleteMatchStage(id) {
  await ensureFirestoreOnline();
  await deleteDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id));
  listCache = null;
}
```

---

## 4. `renderers/list.renderer.js`

```javascript
import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { MATCH_STAGE_MESSAGES, MATCH_STAGE_ROUTES } from '../match-stage.constants.js';

export function renderMatchStageListLoading() { /* spinner using ADMIN_PAGE_SHELL_CLASSES */ }

export function renderMatchStageListPage(stages) {
  // Table columns: Label | Key | Sort Order | Status | Actions
  // Each row links to MATCH_STAGE_ROUTES.ADMIN_LIST?id=...
  // Active badge: bg-success-subtle | Inactive: bg-secondary-subtle
}

export function mountMatchStageListLoading(outlet) { outlet.innerHTML = renderMatchStageListLoading(); }

export function renderMatchStageNotFound(message = MATCH_STAGE_MESSAGES.NOT_FOUND) { /* empty state */ }
```

---

## 5. `renderers/form.renderer.js`

```javascript
import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderIconInputField } from '../../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { MATCH_STAGE_ROUTES, createDefaultMatchStageFields } from '../match-stage.constants.js';

export function renderMatchStageFormPage(stage = null, options = {}) {
  // Fields: label (bi-tag), value (bi-key, readOnly on edit), sortOrder (bi-sort-numeric-up), active (switch)
  // value key is auto-generated from label on create
}

export function readMatchStageForm(form) {
  return {
    label:     form.elements.namedItem('label')?.value ?? '',
    value:     form.elements.namedItem('value')?.value ?? '',
    sortOrder: form.elements.namedItem('sortOrder')?.value ?? '10',
    active:    form.querySelector('#ptw-stage-active')?.checked ?? true,
  };
}
```

---

## 6. `match-stage.renderer.js` (barrel)

```javascript
export { renderMatchStageListLoading, renderMatchStageListPage, mountMatchStageListLoading, renderMatchStageNotFound } from './renderers/list.renderer.js';
export { renderMatchStageFormPage, readMatchStageForm } from './renderers/form.renderer.js';
export { applyFormErrors } from './match-stage.validator.js';
```

---

## 7. `match-stages-admin.page.js`

```javascript
// Pattern: identical to teams-admin.page.js
// initMatchStagesAdminPage → checks Permissions.MANAGE_MATCH_STAGES
// renderListView  → listMatchStages({ forceRefresh: true })
// renderEditView  → getMatchStageById(stageId)
// bindStageForm   → auto-generate value key from label on create
//                 → form submit calls createMatchStage / updateMatchStage
//                 → delete button calls deleteMatchStage with confirmation modal
```

---

## Existing Files to Edit

### `public/js/config/application.constants.js`

```javascript
// Add to FIRESTORE_COLLECTIONS:
MATCH_STAGES: 'match_stages',
```

---

### `public/js/authorization/permission.constants.js`

```javascript
// Add to Permissions:
MANAGE_MATCH_STAGES: 'MANAGE_MATCH_STAGES',
```

---

### `public/js/config/routes.js`

Add after the `/admin/teams` route:

```javascript
{
  path: '/admin/match-stages',
  name: 'admin-match-stages',
  title: 'Match Stages',
  pageModule: '../master-data/match-stages/match-stages-admin.page.js',
  showInNavbar: false,
  showInMobileNav: false,
  requiresAuth: true,
  requiresProfile: false,
  guestOnly: false,
  requiredRole: USER_ROLES.ADMIN,
  roles: [USER_ROLES.ADMIN],
},
```

---

### `public/js/components/sidebar-nav.config.js`

Replace the single Teams item with a **Master Data** group:

```javascript
{
  type: 'group',
  label: 'Master Data',
  icon: 'bi-database',
  children: [
    { path: '/admin/teams',        label: 'Teams' },
    { path: '/admin/match-stages', label: 'Match Stages' },
  ],
},
```

---

### `public/js/match/renderers/form.renderer.js`

1. Keep `import { MATCH_ROUNDS, MATCH_ROUTES }` as fallback.
2. Add `stages` to options destructuring:

```javascript
export function renderMatchFormPage(options) {
  const {
    match = null,
    tournaments,
    teams,
    stages,           // Array<{ value: string, label: string }> | undefined
    inheritedConfig = null,
    isCreate = false,
    readOnly = false,
    includePageWrapper = true,
  } = options;

  // Replace existing roundOptions line:
  const roundOptions = (stages ?? MATCH_ROUNDS).map((round) => ({
    value: round.value,
    label: round.label,
  }));
```

---

### `public/js/match/match-admin.page.js`

1. Add import:

```javascript
import { listMatchStages } from '../master-data/match-stages/match-stage.service.js';
```

2. In `renderCreateView`, add stages to `Promise.all` and pass to renderer:

```javascript
const [tournaments, teams, stages] = await Promise.all([
  listActiveTournaments(),
  listTeams({ activeOnly: true }),
  listMatchStages({ activeOnly: true }),
]);

outlet.innerHTML = renderMatchFormPage({ tournaments, teams, stages, isCreate: true });
```

3. In `renderEditView`, same:

```javascript
const [tournaments, teams, config, stages] = await Promise.all([
  isArchived ? listTournamentsForAdmin({ includeArchived: true }) : listActiveTournaments(),
  listTeams({ activeOnly: !isArchived }),
  isArchived ? Promise.resolve(null) : TournamentConfigurationService.load(match.tournamentId),
  listMatchStages({ activeOnly: true }),
]);

outlet.innerHTML = renderMatchDetailPage(match, {
  tournaments,
  teams: isArchived ? [match.homeTeam, match.awayTeam].filter(Boolean) : teams,
  stages,
  inheritedConfig: config,
  readOnly: isArchived,
});
```

`renderMatchDetailPage` spreads all options into `renderMatchFormPage`, so `stages` flows through automatically.

---

### `firestore.rules`

Add after the `teams` collection block:

```
match /match_stages/{stageId} {
  allow read: if isSignedIn();
  allow create, update, delete: if isAdmin();
}
```

---

## Summary

| What | Details |
|---|---|
| New Firestore collection | `match_stages` — stores `{ label, value, sortOrder, active }` |
| New admin page | `/admin/match-stages` — full CRUD (add / edit / delete / toggle active) |
| Admin sidebar | **Teams** and **Match Stages** grouped under **Master Data** |
| Match create/edit form | Match Stage dropdown loads from Firestore; falls back to `MATCH_ROUNDS` when collection is empty |
| Auto key generation | On create, stage key auto-fills from the label (e.g. `Quarter Final` → `quarter_final`) |
| Backward compatibility | Existing matches with stored stage values display correctly without migration |
| Firestore security | Admins can manage stages; any signed-in user can read (needed for the match form) |

