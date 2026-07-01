# PickTheWinner — Component Library

Reusable UI components for the PickTheWinner frontend.

---

## Icon Input Field

**Module:** `public/js/shared/form/icon-input.component.js`

**CSS:** `.ptw-icon-input` in `public/css/components.css`

### Purpose

Standard form control for login and profile pages. Places a small Bootstrap Icon inside the input container, separated from the text area by a vertical divider — matching the reference auth/profile form pattern.

### API

#### `renderIconInputField(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | required | Input `id` and label `for` |
| `name` | string | required | Input `name` |
| `label` | string | required | Visible label above the field |
| `icon` | string | required | Bootstrap Icon suffix, e.g. `bi-lock` |
| `type` | string | `text` | HTML input type |
| `value` | string | `''` | Initial value |
| `placeholder` | string | `''` | Placeholder text |
| `autocomplete` | string | — | Autocomplete attribute |
| `inputMode` | string | — | `inputmode` attribute |
| `required` | boolean | `false` | Marks field required |
| `requiredMarker` | boolean | `false` | Appends red `*` to label |
| `errorId` | string | — | `id` for sibling `.invalid-feedback` |
| `wrapperClass` | string | `mb-3` | Outer spacing class |

#### `renderIconSelectField(options)`

Same as above, plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `optionsHtml` | string | required | `<option>` markup |
| `disabled` | boolean | `false` | Disables the select |

### Markup structure

```html
<div class="mb-3">
  <label for="field-id" class="form-label">Label</label>
  <div class="ptw-icon-input">
    <span class="ptw-icon-input__icon" aria-hidden="true">
      <i class="bi bi-lock" aria-hidden="true"></i>
    </span>
    <span class="ptw-icon-input__divider" aria-hidden="true"></span>
    <input class="form-control ptw-icon-input__control" ...>
  </div>
  <div class="invalid-feedback" id="field-id-error" role="alert"></div>
</div>
```

### Usage

Login (admin email/password), profile edit (phone), complete profile (phone, district, Pradeshika Sabha).

### Validation

Apply `.is-invalid` to the inner control. Error feedback is shown via `.ptw-icon-input:has(.is-invalid) ~ .invalid-feedback`.

---

## Search Box

**Module:** `public/js/components/search-box.component.js`

Icon-inside-input pattern for search fields (absolute-positioned icon variant).

---

## App Logo

**Module:** `public/js/shared/logo/logo.component.js`

Variants: `navbar`, `hero`, `login`, `footer`.

---

## Avatar

**Module:** `public/js/shared/avatar/avatar.component.js`

User photo with placeholder fallback.
