# User Management Module - Administrator Guide

**Last Updated:** July 3, 2026  
**Module:** User Management  
**Access Level:** Administrators Only

---

## Overview

The User Management module allows administrators to view, search, filter, and manage all registered users in the PickTheWinner application. You can lock or unlock user accounts to control access to the system.

---

## Accessing User Management

1. Sign in as an administrator
2. Navigate to **Admin Dashboard**
3. Click **User Management** in the sidebar, or
4. Go directly to `/admin/users`

---

## User List View

### Statistics Dashboard

At the top of the page, you'll see four key metrics:

- **Total Users** — All registered users
- **Active Users** — Users who can currently access the system
- **Locked Users** — Users whose accounts have been locked
- **Administrators** — Total number of admin users

### Filters

You can filter users by:

- **Status:** All, Active, Locked, Inactive, Suspended
- **Role:** All, Contestant, Administrator
- **Search:** Type name, email, or UID to search

Search is debounced (300ms delay) and filters in real-time.

### User Table (Desktop)

The table displays:

| Column | Description |
|--------|-------------|
| User | Avatar, name, and email |
| Role | Admin or Contestant badge |
| Status | Active, Locked, Inactive, or Suspended badge |
| Registered | Account creation date |
| Last Login | "Today", "Yesterday", "X days ago", or "Never" |
| Tournaments | Total tournaments joined |
| Actions | View, Lock, or Unlock buttons |

### User Cards (Mobile)

On mobile devices, users are displayed as cards showing:
- Avatar and name
- Email address
- Role and status badges
- Last login and tournament count
- Action buttons

---

## Locking a User

### When to Lock

Lock a user account when:
- The user has violated terms of service
- Suspicious activity is detected
- Temporary access suspension is needed
- Investigation is ongoing

### How to Lock

1. Find the user in the list
2. Click the **Lock** button (🔒)
3. A confirmation modal appears
4. **Optional:** Enter a reason for locking (max 500 characters)
5. Click **Lock User** to confirm

### What Happens

When a user is locked:
- Their account status changes to **LOCKED**
- They can no longer sign in to PickTheWinner
- If already signed in, they'll be blocked on next navigation
- They cannot create or update predictions
- They're redirected to an "Account Locked" page
- Lock metadata is recorded:
  - Who locked the account (your UID)
  - When it was locked (timestamp)
  - Reason for locking (if provided)

### Restrictions

You **cannot** lock:
- Your own account
- Other administrator accounts
- Already locked accounts

The system will show an error if you attempt these actions.

---

## Unlocking a User

### How to Unlock

1. Find the locked user (filter by Status: Locked)
2. Click the **Unlock** button (🔓)
3. Confirm the action in the modal
4. Click **Unlock User**

### What Happens

When a user is unlocked:
- Their account status is restored to **ACTIVE**
- They can immediately sign in again
- All lock metadata is cleared
- They regain full access to the application

---

## Locked User Experience

When a locked user tries to access the application:

1. They sign in with Google successfully (Firebase Auth works)
2. The system loads their profile from Firestore
3. The application detects `status === 'LOCKED'`
4. They're immediately redirected to `/account-locked`
5. They see this message:

   > **Your Account Has Been Locked**
   >
   > Your account has been locked by an administrator. Please contact the administrator for assistance.
   >
   > **Access Denied:** You cannot access the application until your account is unlocked by an administrator.

6. They can only sign out

### What They Cannot Do

Locked users:
- ❌ Cannot access the dashboard
- ❌ Cannot view tournaments
- ❌ Cannot create predictions
- ❌ Cannot update predictions
- ❌ Cannot access any protected route
- ✅ Can only sign out

---

## Search Tips

### By Name
```
Search: John Doe
Results: All users with "john" or "doe" in their name
```

### By Email
```
Search: user@example.com
Results: Exact email match or partial match
```

### By UID
```
Search: dpsh123456
Results: User with matching UID
```

**Note:** Search is case-insensitive and searches across name, email, and UID fields.

---

## Pagination

The user list loads 25 users per page by default.

- Click **Next** to load more users
- **Previous** is not currently available (coming soon)
- Total displayed count is shown at the bottom

---

## Best Practices

### Before Locking

1. **Investigate** the user's activity thoroughly
2. **Document** the reason for locking (use the reason field)
3. **Notify** the user via email if possible (manual for now)
4. **Record** the decision in your internal logs

### Lock Reasons

Good lock reasons:
- ✅ "Multiple reports of spam predictions"
- ✅ "Terms of service violation: Section 3.2"
- ✅ "Account security investigation in progress"
- ✅ "User requested temporary suspension"

Avoid vague reasons:
- ❌ "Bad user"
- ❌ "Don't trust them"
- ❌ "Just because"

### After Locking

1. The user will see a generic message (no reason is shown to them)
2. Contact the user directly if needed
3. Monitor for any appeals or contact attempts
4. Document the resolution

### Before Unlocking

1. **Verify** the issue is resolved
2. **Confirm** with other admins if needed
3. **Document** why you're unlocking

---

## Troubleshooting

### User List Won't Load

**Symptom:** Spinner keeps spinning, no users appear

**Cause:** Network issue or Firestore permission problem

**Solution:**
1. Check your internet connection
2. Click the **Refresh** button
3. Check browser console for errors
4. Verify you're signed in as an administrator

---

### Cannot Lock a User

**Symptom:** Lock button is disabled or shows an error

**Possible Causes:**
- You're trying to lock yourself
- You're trying to lock another admin
- The user is already locked
- You don't have permission

**Solution:**
- Verify the user's role and status
- Check that you're not attempting a restricted action
- Contact a super admin if needed

---

### Locked User Still Accessing the App

**Symptom:** User reports they can still access despite being locked

**Cause:** User hasn't refreshed or navigated to a new page

**Solution:**
- Ask the user to refresh the page
- The lock is enforced on next route navigation
- Firestore rules prevent any write operations
- If issue persists, check Firestore rules deployment

---

## Security Notes

### Audit Trail

Lock and unlock actions are recorded with:
- Admin UID (who performed the action)
- Timestamp (when it happened)
- Reason (if provided)

Future enhancement: Full audit log in `audit_logs` collection.

### Firestore Rules

User locks are enforced by:
1. **Client-side:** Route guard redirects locked users
2. **Server-side:** Firestore rules block predictions

Even if a locked user bypasses the client guard, Firestore rules prevent any data modification.

### Firebase Authentication

**Important:** Firebase Authentication tokens remain valid after locking. Locked users are blocked by application logic and Firestore rules, not by token revocation.

This is a Firebase limitation without Firebase Admin SDK (server-side).

---

## Keyboard Shortcuts

Currently none. Future enhancement.

---

## Mobile Usage

The user management interface is fully responsive:

- **Mobile:** Displays user cards with touch-friendly buttons
- **Tablet:** Compact table or cards depending on screen size
- **Desktop:** Full table with all columns

All features work the same across devices.

---

## Frequently Asked Questions

### Can I bulk lock multiple users?

Not yet. This is planned for a future release.

### Can locked users see their own profile?

No. Locked users cannot access any authenticated page.

### How do I notify users when I lock them?

Manual email notification for now. Automatic email notifications are planned.

### Can I see who locked a user?

Yes. The `lockedBy` field stores the admin's UID. Future UI will show the admin's name.

### Can I unlock a user another admin locked?

Yes. Any admin can unlock any locked user.

### Is there a limit to how long a user can be locked?

No. Users remain locked until manually unlocked by an admin.

### Can I edit a user's profile?

Not in the current release. View and edit capabilities are planned for the user profile detail page.

### Can I delete a user?

Not recommended. Use the lock feature instead. Deletion may be added for super admins only.

---

## Related Documentation

- [User Management Implementation](./USER_MANAGEMENT_IMPLEMENTATION.md)
- [Database Schema](./architecture/03_DATABASE_SCHEMA.md)
- [Security Model](./architecture/04_SECURITY_MODEL.md)

---

## Support

For technical issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review error messages in the browser console (F12)
- Contact the development team

---

**Last Updated:** July 3, 2026  
**Version:** 1.0

