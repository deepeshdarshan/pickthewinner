# User Management Module - Workflow Diagrams

**Date:** July 3, 2026  
**Module:** User Management  
**Purpose:** Visual reference for workflows and architecture

---

## 🔄 Lock User Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Admin opens /admin/users
                              ▼
                    ┌──────────────────────┐
                    │   User List Page     │
                    │  - Search/Filter     │
                    │  - Statistics        │
                    │  - User Table        │
                    └──────────────────────┘
                              │
                              │ 2. Click "Lock User" button
                              ▼
                    ┌──────────────────────┐
                    │   Lock User Modal    │
                    │  - Confirmation      │
                    │  - Reason (optional) │
                    │  - Warning message   │
                    └──────────────────────┘
                              │
                              │ 3. Confirm lock
                              ▼
                    ┌──────────────────────┐
                    │  Business Validation │
                    │  - Not self?         │
                    │  - Not admin?        │
                    │  - Not locked?       │
                    └──────────────────────┘
                              │
                              │ ✅ Validation passes
                              ▼
                    ┌──────────────────────┐
                    │ UserAdminService     │
                    │  lockUser(uid, ...)  │
                    └──────────────────────┘
                              │
                              │ 4. Update Firestore
                              ▼
                    ┌──────────────────────┐
                    │  Firestore Update    │
                    │  status: "LOCKED"    │
                    │  lockedBy: adminUid  │
                    │  lockedAt: now()     │
                    │  lockReason: text    │
                    └──────────────────────┘
                              │
                              │ 5. Success
                              ▼
                    ┌──────────────────────┐
                    │  Emit USER_LOCKED    │
                    │  Show Success Toast  │
                    │  Refresh User List   │
                    └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      USER EXPERIENCE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User tries to access app
                              ▼
                    ┌──────────────────────┐
                    │  Google SSO Success  │
                    │  Firebase Auth ✅     │
                    └──────────────────────┘
                              │
                              │ Load user profile
                              ▼
                    ┌──────────────────────┐
                    │  user.guard.js       │
                    │  Check status field  │
                    └──────────────────────┘
                              │
                              │ status === "LOCKED"
                              ▼
                    ┌──────────────────────┐
                    │  Redirect to         │
                    │  /account-locked     │
                    └──────────────────────┘
                              │
                              │
                              ▼
                    ┌──────────────────────┐
                    │  Account Locked Page │
                    │  🔒 Error message    │
                    │  [Logout Button]     │
                    └──────────────────────┘
                              │
                              │ User clicks logout
                              ▼
                    ┌──────────────────────┐
                    │  performLogout()     │
                    │  Clear session       │
                    │  Redirect to /login  │
                    └──────────────────────┘
```

---

## 🔓 Unlock User Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Admin finds locked user
                              ▼
                    ┌──────────────────────┐
                    │   User List Page     │
                    │  Filter: LOCKED      │
                    └──────────────────────┘
                              │
                              │ 2. Click "Unlock User"
                              ▼
                    ┌──────────────────────┐
                    │  Unlock User Modal   │
                    │  - Confirmation only │
                    │  - No reason needed  │
                    └──────────────────────┘
                              │
                              │ 3. Confirm unlock
                              ▼
                    ┌──────────────────────┐
                    │ UserAdminService     │
                    │  unlockUser(uid)     │
                    └──────────────────────┘
                              │
                              │ 4. Update Firestore
                              ▼
                    ┌──────────────────────┐
                    │  Firestore Update    │
                    │  status: "ACTIVE"    │
                    │  lockedBy: null      │
                    │  lockedAt: null      │
                    │  lockReason: null    │
                    └──────────────────────┘
                              │
                              │ 5. Success
                              ▼
                    ┌──────────────────────┐
                    │  Emit USER_UNLOCKED  │
                    │  Show Success Toast  │
                    │  Refresh User List   │
                    └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      USER EXPERIENCE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User tries to access app
                              ▼
                    ┌──────────────────────┐
                    │  Google SSO Success  │
                    │  Firebase Auth ✅     │
                    └──────────────────────┘
                              │
                              │ Load user profile
                              ▼
                    ┌──────────────────────┐
                    │  user.guard.js       │
                    │  Check status field  │
                    └──────────────────────┘
                              │
                              │ status === "ACTIVE"
                              ▼
                    ┌──────────────────────┐
                    │  Allow Access ✅      │
                    │  Proceed to page     │
                    └──────────────────────┘
                              │
                              │
                              ▼
                    ┌──────────────────────┐
                    │  Dashboard or        │
                    │  Requested Route     │
                    └──────────────────────┘
```

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 user-management.page.js                                      │
│     └── Orchestrates page rendering and user interactions       │
│                                                                  │
│  📄 account-locked.page.js                                       │
│     └── Error page for locked users                             │
│                                                                  │
│  🎨 user-admin.renderer.js                                       │
│     └── renderUserTable()                                        │
│     └── renderUserCards()                                        │
│     └── renderUserStatistics()                                   │
│     └── renderLockUserModal()                                    │
│     └── renderUnlockUserModal()                                  │
│     └── renderUserFilters()                                      │
│     └── renderPaginationControls()                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BUSINESS LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🧠 user-admin.domain.js                                         │
│     └── canLockUser() — validation logic                        │
│     └── canUnlockUser() — validation logic                      │
│     └── validateLockReason() — input validation                 │
│     └── formatUserStatus() — display logic                      │
│     └── getUserActivityLabel() — display logic                  │
│                                                                  │
└───────────────────────────────��─────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚙️ user-admin.service.js (extends BaseFirestoreService)        │
│     └── getAllUsers() — paginated query                         │
│     └── getUsersByStatus() — filtered query                     │
│     └── getUsersByRole() — filtered query                       │
│     └── searchUsers() — client-side search                      │
│     └── lockUser() — Firestore write                            │
│     └── unlockUser() — Firestore write                          │
│     └── getUserStatistics() — aggregate counts                  │
│                                                                  │
│  ⚙️ user.service.js                                              │
│     └── isUserLocked() — status check helper                    │
│     └── loadCurrentUser() — profile loading                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🗄️ Cloud Firestore                                             │
│     └── Collection: users                                        │
│         └── Document: {uid}                                      │
│             └── status: "ACTIVE" | "LOCKED" | ...               │
│             └── lockedBy: adminUid | null                        │
│             └── lockedAt: Timestamp | null                       │
│             └── lockReason: string | null                        │
│                                                                  │
│  🔒 Security Rules                                               │
│     └── Only admins can update status                           │
│     └── Locked users cannot create predictions                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Enforcement Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER DIAGRAM                        │
└─────────────────────────────────────────────────────────────────┘

1️⃣ Client-Side Guard
   ┌────────────────────────────────────┐
   │  user.guard.js                     │
   │  ▸ Checks status on navigation     │
   │  ▸ Redirects locked users          │
   │  ▸ Logs warning                    │
   └────────────────────────────────────┘
                  │
                  │ Can be bypassed by tech-savvy users
                  │ (inspect element, disable JS, etc.)
                  ▼
2️⃣ Firestore Security Rules
   ┌────────────────────────────────────┐
   │  firestore.rules                   │
   │  ▸ Server-side enforcement         │
   │  ▸ Cannot be bypassed              │
   │  ▸ Blocks prediction writes        │
   │  ▸ Only admins can update status   │
   └────────────────────────────────────┘
                  │
                  │ Defense in depth
                  ▼
3️⃣ Firebase Authentication
   ┌────────────────────────────────────┐
   │  Firebase Auth                     │
   │  ▸ Token remains valid after lock  │
   │  ▸ No server-side revocation       │
   │  ▸ Limitation of client-only app   │
   └────────────────────────────────────┘

Result: Multi-layered security approach
```

---

## 📊 Data Flow - Lock User

```
Admin Browser                Service Layer              Firestore
─────────────                ─────────────              ─────────

     │                            │                         │
     │  1. Click Lock User        │                         │
     ├──────────────────────────> │                         │
     │                            │                         │
     │  2. Validate (domain)      │                         │
     │    canLockUser()           │                         │
     │ <──────────────────────────┤                         │
     │                            │                         │
     │  3. Call lockUser()        │                         │
     ├──────────────────────────> │                         │
     │                            │                         │
     │                            │  4. updateDoc()         │
     │                            ├───────────────────────> │
     │                            │     status: "LOCKED"    │
     │                            │     lockedBy: adminUid  │
     │                            │     lockedAt: now()     │
     │                            │     lockReason: text    │
     │                            │                         │
     │                            │  5. Write Success ✅    │
     │                            │ <───────────────────────┤
     │                            │                         │
     │  6. Emit USER_LOCKED       │                         │
     │ <──────────────────────────┤                         │
     │                            │                         │
     │  7. Show Toast + Refresh   │                         │
     │                            │                         │

Locked User Browser          Route Guard                Firestore
───────────────────          ───────────                ─────────

     │                            │                         │
     │  1. Navigate to page       │                         │
     ├──────────────────────────> │                         │
     │                            │                         │
     │                            │  2. Load profile        │
     │                            ├───────────────────────> │
     │                            │                         │
     │                            │  3. Return profile      │
     │                            │     status: "LOCKED"    │
     │                            │ <───────────────────────┤
     │                            │                         │
     │                            │  4. Check isUserLocked()│
     │                            │     Returns: true       │
     │                            │                         │
     │  5. Redirect to            │                         │
     │     /account-locked        │                         │
     │ <──────────────────────────┤                         │
     │                            │                         │
     │  6. Show error page        │                         │
     │                            │                         │
```

---

## 🎯 Component Interaction Map

```
user-management.page.js
        │
        ├─► UserAdminService
        │       └─► getAllUsers()
        │       └─► getUserStatistics()
        │       └─► lockUser()
        │       └─► unlockUser()
        │
        ├─► UserAdminDomain
        │       └─► canLockUser()
        │       └─► canUnlockUser()
        │       └─► formatUserStatus()
        │
        ├─► user-admin.renderer.js
        │       └─► renderUserTable()
        │       └─► renderUserCards()
        │       └─► renderUserStatistics()
        │       └─► renderLockUserModal()
        │       └─► renderUnlockUserModal()
        │
        ├─► user.service.js
        │       └─► getCachedProfile()
        │
        ├─► toast.component.js
        │       └─► showToast()
        │
        └─► Bootstrap Modal API
                └─► new bootstrap.Modal()
```

---

## 📱 Responsive Rendering Decision Tree

```
                    Page Load
                        │
                        │
                        ▼
            ┌───────────────────────┐
            │ Check window.innerWidth│
            └───────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │                               │
    < 768px                         ≥ 768px
        │                               │
        ▼                               ▼
┌───────────────┐            ┌──────────────────┐
│ Mobile Layout │            │ Desktop Layout   │
└───────────────┘            └──────────────────┘
        │                               │
        ▼                               ▼
renderUserCards()              renderUserTable()
        │                               │
        ▼                               ▼
┌───────────────┐            ┌──────────────────┐
│ Card Layout:  │            │ Table Layout:    │
│ - Avatar      │            │ - User Column    │
│ - Name/Email  │            │ - Role Column    │
│ - Badges      │            │ - Status Column  │
│ - Stats       │            │ - Registered     │
│ - Actions     │            │ - Last Login     │
└───────────────┘            │ - Tournaments    │
                             │ - Actions        │
                             └──────────────────┘
```

---

## 🔄 Event Flow

```
USER_LOCKED Event
─────────────────

Lock Action
     │
     ▼
UserAdminService.lockUser()
     │
     ▼
Firestore updateDoc()
     │
     ▼
emitUserEvent(USER_EVENTS.USER_LOCKED, { uid, adminUid, reason })
     │
     ├─► Logger.info() — Log the action
     │
     ├─► (Future) Audit Log Service — Record to audit_logs
     │
     └─► (Future) Email Service — Send notification


USER_UNLOCKED Event
───────────────────

Unlock Action
     │
     ▼
UserAdminService.unlockUser()
     │
     ▼
Firestore updateDoc()
     │
     ▼
emitUserEvent(USER_EVENTS.USER_UNLOCKED, { uid, adminUid })
     │
     ├─► Logger.info() — Log the action
     │
     ├─► (Future) Audit Log Service — Record to audit_logs
     │
     └─► (Future) Email Service — Send notification
```

---

## 🧪 Test Coverage Map

```
user-admin.domain.test.js
├─► canLockUser()
│   ├─► ✅ Allow admin to lock contestant
│   ├─► ✅ Prevent locking self
│   ├─► ✅ Prevent locking other admin
│   └─► ✅ Prevent locking already locked user
│
├─► canUnlockUser()
│   ├─► ✅ Allow unlocking locked user
│   └─► ✅ Prevent unlocking non-locked user
│
├─► validateLockReason()
│   ├─► ✅ Allow empty reason
│   ├─► ✅ Allow valid reason
│   └─► ✅ Reject reason > 500 chars
│
├─► formatUserStatus()
│   ├─► ✅ Format ACTIVE
│   ├─► ✅ Format LOCKED
│   └─► ✅ Handle unknown status
│
├─► getUserActivityLabel()
│   ├─► ✅ Return "Never" for null
│   ├─► ✅ Return "Today" for today
│   ├─► ✅ Return "Yesterday" for yesterday
│   └─► ✅ Return "X days ago" for recent
│
└─► Badge Classes
    ├─► ✅ getStatusBadgeClass()
    └─► ✅ getRoleBadgeClass()

Total: 10 test cases
```

---

**End of Workflow Diagrams**  
**Date:** July 3, 2026  
**Version:** 1.0

