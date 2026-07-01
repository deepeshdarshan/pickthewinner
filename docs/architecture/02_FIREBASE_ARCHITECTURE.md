# Firebase Architecture

| Property | Value |
|----------|--------|
| Version | 1.1 |
| Status | Active |
| Last Updated | July 2026 |

## Services Used

- **Firebase Authentication** — Google SSO, email/password admin login
- **Cloud Firestore** — user profiles (extensible for tournaments, matches, predictions)
- **Firebase Storage** — initialized, reserved for future assets
- **Firebase Hosting** — configured via `firebase.json`

## Initialization

Single entry point: `public/js/firebase/firebase.js`

Imported once from `app.js`. No duplicate initialization permitted.

## Data Access Pattern

```
Page → Service → Domain (validation) → BaseFirestoreService → Firestore
```

- Services handle Firestore I/O and caching
- Domain modules validate business rules before writes
- `TournamentConfigurationService` is the only entry for tournament settings reads

## Caching Strategy

- `user.service.js` — in-memory profile cache synced to `ApplicationContext`
- `BaseFirestoreService` — per-document cache map for extending services
- `TournamentConfigurationService` — configuration cache per tournament

## Security

Client-side role assignment is a suggestion only. Authoritative role enforcement must be implemented in Firestore Security Rules (see `04_SECURITY_MODEL.md`).

Protected user fields (`role`, `status`, `statistics`, etc.) are stripped client-side and must be blocked server-side.

## Future Collections

| Collection | Owner Module |
|------------|--------------|
| `users` | User Management |
| `tournaments` | Tournament Module |
| `matches` | Match Module |
| `predictions` | Prediction Engine |
| `leaderboard` | Leaderboard |

Each collection service should extend `BaseFirestoreService`.
