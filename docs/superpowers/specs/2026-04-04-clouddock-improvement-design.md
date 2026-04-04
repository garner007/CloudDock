# CloudDock Improvement Plan — Design Spec

**Date:** 2026-04-04
**Status:** Draft
**Goal:** Transform localstack-desktop into CloudDock — a polished, secure, well-tested, backend-agnostic AWS emulator GUI.

---

## Phasing Overview

| Phase | Focus | Approach |
|-------|-------|----------|
| 1 | Shared infrastructure + deduplication | Parallel worktrees per sub-task |
| 2 | Security hardening | Sequential (touches shared code from Phase 1) |
| 3 | UI/UX polish + accessibility + navigation | Parallel worktrees |
| 4 | Test coverage backfill | Parallel worktrees |
| 5 | Rename to CloudDock | Single PR, find-and-replace |

Each phase produces small, focused PRs. Tests are written alongside new shared code (TDD). Build verification (`npm test && npm run build:react`) runs at the end of every PR.

---

## Phase 1: Deduplication & Shared Infrastructure

### 1A. Settings Context (`useSettings` hook + SettingsProvider)

**Problem:** Sidebar, TopBar, CommandPalette, and every page independently read localStorage for `ls_backend`, `ls_endpoint`, `ls_region`, etc. Changes in Settings page don't propagate without reload.

**Design:**
- Create `src/contexts/SettingsContext.js` with a React Context + Provider.
- Provider reads from localStorage on mount, exposes `{ endpoint, region, accessKey, secretKey, backendId, setSettings }`.
- `setSettings` updates both context state and localStorage (and Electron safeStorage when available — Phase 2 completes this).
- Create `src/hooks/useSettings.js` that wraps `useContext(SettingsContext)`.
- Wrap `<App>` in `<SettingsProvider>`.
- Migrate all `localStorage.getItem('ls_*')` calls to `useSettings()`.

**Files created:**
- `src/contexts/SettingsContext.js`
- `src/hooks/useSettings.js`

**Files modified:**
- `src/App.js` (wrap in provider)
- `src/components/Sidebar.js` (replace localStorage reads)
- `src/components/TopBar.js` (replace localStorage reads)
- `src/components/CommandPalette.js` (replace localStorage reads)
- `src/pages/SettingsPage.js` (use setSettings instead of direct localStorage)
- `src/pages/DashboardPage.js` (replace localStorage reads)
- `src/services/awsClients.js` (accept config as parameter instead of reading localStorage)

**Tests:** Unit tests for SettingsContext (default values, update propagation, localStorage sync).

---

### 1B. Shared Hooks

#### `useAwsResource(loadFn, opts)`

**Problem:** Every page repeats: `useState([])`, `useState(false)` for loading, `useCallback` with try/catch/finally, `useEffect` for auto-load.

**Design:**
```js
function useAwsResource(loadFn, { autoLoad = true, deps = [] } = {}) {
  // Returns: { items, loading, error, refresh, setItems }
  // loadFn receives config from useSettings
  // Handles try/catch → sets error
  // Calls loadFn on mount if autoLoad
  // refresh() can be called manually
}
```

**Tests:** Mock loadFn, verify loading states, error handling, auto-load behavior, manual refresh.

#### `useAwsAction(actionFn, opts)`

**Problem:** Create/delete/update operations repeat loading state + try/catch + notification + post-action refresh.

**Design:**
```js
function useAwsAction(actionFn, { onSuccess, successMessage, refreshFn } = {}) {
  // Returns: { execute, loading }
  // execute(...args) calls actionFn, shows notification, calls refreshFn
  // Catches errors, shows error notification
}
```

**Tests:** Mock actionFn, verify success/error flows, notification calls, refresh triggers.

#### `useSupportedServices()`

**Problem:** `SERVICES.filter(s => isServiceSupported(s.id, backendId))` duplicated in 4+ files.

**Design:**
```js
function useSupportedServices() {
  const { backendId } = useSettings();
  return useMemo(() => SERVICES.filter(s => isServiceSupported(s.id, backendId)), [backendId]);
}
```

**Tests:** Verify filtering by backend, memoization.

**Files created:**
- `src/hooks/useAwsResource.js`
- `src/hooks/useAwsAction.js`
- `src/hooks/useSupportedServices.js`
- `src/__tests__/hooks/useAwsResource.test.js`
- `src/__tests__/hooks/useAwsAction.test.js`
- `src/__tests__/hooks/useSupportedServices.test.js`

---

### 1C. Shared Components

#### `<DataTable>`

**Problem:** Every list page builds an identical `<table className="data-table">` with `<thead>`, `<tbody>`, row mapping, empty state, and loading state.

**Design:**
```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', mono: true },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'created', label: 'Created', render: (val) => fmtDate(val) },
  ]}
  data={items}
  loading={loading}
  onRowClick={(item) => setSelected(item)}
  rowKey="name"
  emptyIcon={Database}
  emptyTitle="No tables"
  emptyDescription="Create your first table to get started."
  actions={(item) => (
    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.name)}>Delete</button>
  )}
  searchable          // optional: adds a built-in filter bar
  searchPlaceholder="Filter tables..."
  searchKeys={['name']}
/>
```

Features:
- Built-in search/filter (optional, enabled via `searchable` prop)
- Built-in loading skeleton
- Built-in empty state
- Row click handler
- Per-row actions column
- Sortable columns (click header to toggle asc/desc)
- Keyboard navigation (arrow keys to move, Enter to select)
- Proper `aria-*` attributes on table, headers, rows

**Tests:** Renders columns, handles empty state, search filtering, row click, sort, keyboard nav, loading skeleton.

#### `<StatusBadge>`

**Design:**
```jsx
<StatusBadge status="ACTIVE" colorMap={{ ACTIVE: 'green', FAILED: 'red', PENDING: 'yellow' }} />
// Renders: <span className="badge badge-green" role="status">● ACTIVE</span>
// The ● prefix provides non-color status indicator for accessibility
```

**Tests:** Correct class, fallback to gray, aria role.

#### `<EmptyState>`

**Design:**
```jsx
<EmptyState icon={Database} title="No tables" description="Create your first table." action={<button>Create Table</button>} />
```

**Tests:** Renders title, description, action button, icon.

#### `<DetailPanel>`

**Design:**
```jsx
<DetailPanel title="Table: my-table" onClose={handleClose} width="lg">
  <KVGrid data={[{ label: 'ARN', value: tableArn }, ...]} />
  <DetailJSON data={tableDetails} />
</DetailPanel>
```

Slide-over from right with backdrop. Trap focus inside panel. Close on Escape or backdrop click.

**Tests:** Open/close, focus trap, Escape key, backdrop click.

#### `<CreateModal>`

**Design:**
```jsx
<CreateModal
  title="Create Table"
  open={showCreate}
  onClose={() => setShowCreate(false)}
  onSubmit={handleCreate}
  loading={creating}
  fields={[
    { name: 'tableName', label: 'Table Name', required: true, validate: validateTableName },
    { name: 'partitionKey', label: 'Partition Key', required: true },
    { name: 'keyType', label: 'Key Type', type: 'select', options: ['S', 'N', 'B'] },
  ]}
/>
```

Features:
- Field-level validation (uses existing validators from `validation.js`)
- Submit on Enter
- Loading state on submit button
- Focus first field on open
- Close on Escape

**Tests:** Renders fields, validation errors, submit flow, loading state, keyboard.

#### `<ConfirmDialog>` (improve existing)

**Improvements:**
- Add loading state for async onConfirm
- Add `aria-describedby` for screen readers
- Disable confirm button while processing

**Tests:** Loading state, async confirm, cancel, keyboard.

**Files created:**
- `src/components/DataTable.js` + `DataTable.css`
- `src/components/StatusBadge.js`
- `src/components/EmptyState.js`
- `src/components/DetailPanel.js` + `DetailPanel.css`
- `src/components/CreateModal.js`
- `src/components/KVGrid.js`
- Tests for each in `src/__tests__/components/`

---

### 1D. Shared Utilities

**File:** `src/utils/formatters.js`
```js
export const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
export const fmtSize = (bytes) => { /* human-readable size */ };
export const fmtArn = (arn) => arn?.split(':').pop() || '—';
export const truncate = (str, len = 40) => str?.length > len ? str.slice(0, len) + '…' : str;
```

**File:** `src/utils/constants.js`
```js
export const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', ...];
export const STORAGE_KEYS = { ENDPOINT: 'ls_endpoint', REGION: 'ls_region', ... };
```

**Tests:** Unit tests for all formatters.

---

### 1E. Migrate All Pages

Refactor each of the 25 dedicated pages to use the shared hooks and components. Each page should shrink to service-specific logic only:

**Pattern after migration:**
```jsx
export default function DynamoDBPage({ health, showNotification, onNavigate, setPageTrail }) {
  const config = useSettings();
  const { items, loading, refresh } = useAwsResource(loadTables, { deps: [config] });
  const { execute: createTable, loading: creating } = useAwsAction(doCreateTable, { refreshFn: refresh, successMessage: 'Table created' });
  const { confirmDialog, requestDelete } = useConfirmDelete(doDeleteTable, { refreshFn: refresh });

  return (
    <>
      <PageHeader title="DynamoDB" icon={Database} subtitle="NoSQL Tables">
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Table</button>
      </PageHeader>
      <DataTable columns={columns} data={items} loading={loading} ... />
      {confirmDialog}
    </>
  );
}
```

Each page should go from ~200-400 lines down to ~60-120 lines.

**Migration order:** Start with S3Page and DynamoDBPage (have the best test coverage), then fan out to remaining pages in parallel batches.

---

## Phase 2: Security Hardening

### 2A. Async Credential Migration

**Problem:** `awsClients.js` uses deprecated `getCredentialSync()` reading plaintext from localStorage.

**Design:**
- Refactor `getConfig()` to be async: `async function getConfig()`.
- It reads from `useSettings` context when called from React components, or from async `getCredential()` when called from service functions.
- Refactor `getClient(importFn)` to pass a service name string instead of using `importFn.toString()`.
- New signature: `getClient(serviceName, ClientClass)` with explicit cache key.
- Remove `getCredentialSync()` entirely.
- Add `client.destroy()` calls in `clearClientCache()`.

**Files modified:**
- `src/services/awsClients.js` (major rewrite)
- `src/services/credentials.js` (remove sync getter, fix silent catch)
- All pages that call `getConfig()` or `getClient()` (should be minimal after Phase 1 migration)

**Tests:** Verify async config loading, client caching by service name, cache invalidation with destroy.

### 2B. Electron IPC Security

**Problem:** `executeJavaScript` string interpolation for navigation, no validation on `cred:set`.

**Design:**
- Replace `executeJavaScript(`window.__navigateTo(...)`)` with `webContents.send('navigate', id)`.
- Add `ipcRenderer.on('navigate', ...)` in preload/renderer.
- Add `CRED_KEYS` whitelist validation in `cred:set` handler.
- Add type checking: values must be strings.

**Files modified:**
- `public/electron.js`
- `public/preload.js`
- `src/App.js` (listen for IPC navigate events)

**Tests:** Integration tests for IPC message validation.

### 2C. Input Validation Wiring

**Problem:** Validators exist in `validation.js` but aren't called before API operations.

**Design:**
- `<CreateModal>` already accepts `validate` per field (from Phase 1).
- Wire up existing validators: `validateBucketName`, `validateTableName`, `validateQueueName`, etc.
- Add endpoint URL validation in Settings: parse with `new URL()`, reject non-http(s).

**Files modified:** All page files (add validate prop to CreateModal fields).

### 2D. Sensitive Value Display

**Problem:** STS page shows SecretAccessKey in plaintext. Other pages may show secrets.

**Design:**
- Create `<SecretValue>` component: blurred by default, click/button to reveal, auto-re-blur after 10s.
- Use in STSPage, SecretsPage, and any page displaying sensitive values.

**Files created:** `src/components/SecretValue.js` + test.

---

## Phase 3: UI/UX Polish, Accessibility & Navigation

### 3A. Navigation Improvements

**Current issues:**
- No URL-based routing — can't bookmark or deep-link to a service.
- No browser back/forward support.
- Breadcrumb trail is fragile (relies on callback refs).

**Design:**
- Implement hash-based routing: `#/s3`, `#/dynamodb`, `#/settings`.
- Use `window.location.hash` + `hashchange` event (no react-router needed for this simple case).
- Back/forward browser buttons work naturally.
- Breadcrumb reads from hash + page trail.
- Sidebar active state derived from hash.
- Deep-link support: opening `#/s3` navigates directly to S3 page.

**Files modified:**
- `src/App.js` (hash-based navigation)
- `src/components/Sidebar.js` (derive active from hash)
- `src/components/Breadcrumb.js` (read from hash)
- `src/components/TopBar.js` (search navigates via hash)
- `src/components/CommandPalette.js` (navigate via hash)

### 3B. Accessibility (WCAG AA)

**Design:**
- Add `focus-visible` outlines to all interactive elements (buttons, inputs, links, table rows).
- Add `aria-live="polite"` region for toast notifications.
- Add `role="status"` to StatusBadge.
- Add `aria-label` to icon-only buttons (sidebar toggle, close buttons, refresh).
- Add skip-to-content link (visually hidden, visible on focus).
- Add `aria-busy="true"` to loading spinners.
- Badge text includes `●` prefix for non-color status indication.
- Modal focus trap (already partially done, complete it).

**CSS additions (in index.css):**
```css
/* Focus indicators */
:focus-visible {
  outline: 2px solid var(--aws-orange);
  outline-offset: 2px;
}

/* Skip to content */
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 9999;
}
.skip-to-content:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 8px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
```

### 3C. UI Polish

**Design improvements:**
- **Typography scale:** Standardize on 6px baseline: 11px (labels), 13px (body), 14px (default), 16px (section titles), 20px (page titles), 28px (stat values).
- **Spacing system:** Standardize on 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Transition refinement:** Add subtle hover transitions to table rows, cards, and sidebar items (0.15s ease).
- **Toast notifications:** Add slide-in from right animation, auto-dismiss progress bar, stack multiple toasts.
- **Empty states:** Add subtle illustration/icon treatment, slightly larger with more breathing room.
- **Loading skeletons:** Use consistent shimmer animation across all pages (replace ad-hoc loading spinners in table bodies).
- **Card hover effects:** Subtle elevation change on hover for stat cards and clickable cards.
- **Sidebar:** Add subtle group count badges (e.g., "Storage (3)"), smooth expand/collapse animation.
- **Search bar:** Add Cmd+K hint badge inside the search bar.
- **Button states:** Add active/pressed state (scale(0.98)) for tactile feedback.

### 3D. CSS Architecture

**Problem:** Monolithic App.css (462 lines), inline styles in pages.

**Design:**
- Keep `themes.css` and `index.css` as globals.
- Keep `App.css` for layout-only styles (app-shell, app-body, app-content).
- Each shared component gets its own CSS file (DataTable.css, DetailPanel.css, etc.).
- Extract notification styles to `Notification.css`.
- Remove inline styles from pages during Phase 1 migration (use CSS classes).

---

## Phase 4: Test Coverage Backfill

**Goal:** ~80% coverage across all files.

### 4A. Component Tests
Add tests for all untested components:
- CommandPalette, Breadcrumb, ErrorBoundary, GenericServicePage, ServiceUnavailable, CopyButton, SkeletonLoader
- New shared components from Phase 1 (already covered by TDD)

### 4B. Service Tests
Add tests for:
- `backends.js` (backend detection, health check, supported services)
- `catalog.js` (service lookup, group filtering)
- `credentials.js` (async get/set, Electron path, fallback)
- `validation.js` (all validators, edge cases)

### 4C. Page Tests
Add tests for all 20 untested pages. Use the same MSW mock pattern as existing tests.
Priority order (by likely usage):
1. IAMPage, SecretsPage, CloudWatchPage, APIGatewayPage
2. SNSPage, KinesisPage, CloudFormationPage, Route53Page
3. CognitoPage, SSMPage, EventBridgePage, StepFunctionsPage
4. EC2Page, ECSPage, ECRPage, KMSPage
5. SESPage, ElastiCachePage, FirehosePage, ACMPage, STSPage

### 4D. Integration Test Expansion
- Add integration tests for services that only have unit tests.
- Add error scenario tests (connection refused, auth failure, throttling).

---

## Phase 5: Rename to CloudDock

**Scope:** Pure find-and-replace, no logic changes.

**Changes:**
- `package.json`: name, productName, appId → `cloud.clouddock.app`
- `public/index.html`: `<title>CloudDock</title>`
- `public/electron.js`: window title, menu labels
- `README.md`: full rewrite with new name
- `build.sh` / `build.bat`: output names
- Electron builder config: productName, dmg title, nsis shortcutName
- CSS variable prefix: keep `--aws-*` (they refer to AWS service colors, not the app name)
- localStorage keys: keep `ls_*` prefix (migration not worth the breaking change)

---

## Execution Strategy

### Parallel Worktree Plan

Phase 1 sub-tasks are independent and can run in parallel worktrees:

| Worktree | Task | Dependencies |
|----------|------|-------------|
| wt-1a | SettingsContext + useSettings | None |
| wt-1b | Shared hooks (useAwsResource, useAwsAction, useSupportedServices) | None |
| wt-1c | Shared components (DataTable, StatusBadge, EmptyState, DetailPanel, CreateModal) | None |
| wt-1d | Shared utilities (formatters, constants) | None |

After merging 1a-1d → 1e (page migration) in batches of 4-5 pages per worktree.

Phase 3 sub-tasks can also parallelize:
| Worktree | Task |
|----------|------|
| wt-3a | Hash-based navigation |
| wt-3b | Accessibility |
| wt-3c | UI polish + CSS architecture |

Phase 4 test backfill: 4-5 parallel worktrees, each covering a batch of pages.

### Build Verification

Every PR must pass before merge:
1. `npm test` — all unit tests pass
2. `npm run build:react` — production build succeeds
3. Manual smoke test for UI changes (verify in Electron with `npm start`)

### Branch Naming

Per CLAUDE.md conventions:
- `cgarner/feat-settings-context`
- `cgarner/feat-shared-hooks`
- `cgarner/feat-shared-components`
- `cgarner/feat-shared-utils`
- `cgarner/refactor-page-migration-batch-1`
- `cgarner/fix-credential-security`
- `cgarner/fix-electron-ipc-security`
- `cgarner/feat-hash-navigation`
- `cgarner/feat-accessibility`
- `cgarner/feat-ui-polish`
- `cgarner/test-coverage-batch-1`
- `cgarner/chore-rename-clouddock`
