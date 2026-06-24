# Production-Grade Next.js 16 PWA Push Notification System

## Complete Enterprise Folder Structure

```
bulk-notification-system/
├── app/                              # Next.js 16 App Router
│   ├── (admin)/                      # Admin routes group
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   ├── page.tsx
│   │   │   │   └── send/
│   │   │   │       └── page.tsx
│   │   │   ├── devices/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   ├── route.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   └── validator.ts
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts
│   │   │   │   ├── send/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── validator.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── schedule/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── worker.ts
│   │   │   │   └── analytics/
│   │   │   │       └── route.ts
│   │   │   ├── devices/
│   │   │   │   ├── route.ts
│   │   │   │   ├── stats/
│   │   │   │   │   └── route.ts
│   │   │   │   └── cleanup/
│   │   │   │       └── route.ts
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── create/
│   │   │           └── route.ts
│   │   ├── device/
│   │   │   ├── register/
│   │   │   │   ├── route.ts
│   │   │   │   └── validator.ts
│   │   │   ├── subscribe/
│   │   │   │   ├── route.ts
│   │   │   │   └── service.ts
│   │   │   ├── unsubscribe/
│   │   │   │   └── route.ts
│   │   │   ├── update/
│   │   │   │   └── route.ts
│   │   │   └── verify/
│   │   │       └── route.ts
│   │   ├── upload/
│   │   │   ├── route.ts
│   │   │   ├── validator.ts
│   │   │   └── storage.ts
│   │   ├── fcm/
│   │   │   ├── send/
│   │   │   │   ├── route.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── batch.ts
│   │   │   │   └── retry.ts
│   │   │   ├── token/
│   │   │   │   ├── validate.ts
│   │   │   │   └── refresh.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── scheduler/
│   │   │   ├── route.ts
│   │   │   ├── worker.ts
│   │   │   └── queue.ts
│   │   └── health/
│   │       ├── route.ts
│   │       └── readiness.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── manifest.json
│   └── not-found.tsx
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── pagination.tsx
│   │   ├── badge.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   ├── alert.tsx
│   │   └── form/
│   │       ├── form-field.tsx
│   │       └── form-context.tsx
│   ├── admin/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── menu.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   └── chart.tsx
│   │   ├── notifications/
│   │   │   ├── notification-form.tsx
│   │   │   ├── notification-list.tsx
│   │   │   ├── notification-item.tsx
│   │   │   └── scheduler.tsx
│   │   ├── devices/
│   │   │   ├── device-list.tsx
│   │   │   ├── device-item.tsx
│   │   │   └── device-filters.tsx
│   │   └── auth/
│   │       ├── login-form.tsx
│   │       └── session-manager.tsx
│   ├── pwa/
│   │   ├── firebase-provider.tsx
│   │   ├── install-prompt.tsx
│   │   ├── notification-permission.tsx
│   │   ├── device-registration.tsx
│   │   └── push-manager.tsx
│   └── shared/
│       ├── loading.tsx
│       └── error-boundary.tsx
│
├── lib/
│   ├── db/
│   │   ├── connect.ts
│   │   ├── connection-pool.ts
│   │   ├── transaction.ts
│   │   ├── index.ts
│   │   ├── models/
│   │   │   ├── device.ts
│   │   │   ├── notification.ts
│   │   │   ├── admin.ts
│   │   │   └── scheduled.ts
│   │   ├── schemas/
│   │   │   ├── device.schema.ts
│   │   │   ├── notification.schema.ts
│   │   │   └── admin.schema.ts
│   │   └── repositories/
│   │       ├── device.repository.ts
│   │       ├── notification.repository.ts
│   │       └── admin.repository.ts
│   ├── firebase/
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   ├── config.ts
│   │   ├── messaging.ts
│   │   ├── token-manager.ts
│   │   ├── batch-sender.ts
│   │   └── retry-handler.ts
│   ├── auth/
│   │   ├── admin.ts
│   │   ├── session.ts
│   │   ├── middleware.ts
│   │   ├── guards/
│   │   │   ├── admin.guard.ts
│   │   │   └── session.guard.ts
│   │   └── strategies/
│   │       ├── jwt.strategy.ts
│   │       └── cookie.strategy.ts
│   ├── services/
│   │   ├── notification.service.ts
│   │   ├── device.service.ts
│   │   ├── scheduler.service.ts
│   │   ├── analytics.service.ts
│   │   ├── upload.service.ts
│   │   └── fcm.service.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── parser.ts
│   │   ├── formatter.ts
│   │   ├── logger.ts
│   │   └── constants.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── firebase.config.ts
│   │   ├── db.config.ts
│   │   └── env.config.ts
│   └── middleware/
│       ├── auth.middleware.ts
│       ├── logger.middleware.ts
│       ├── rate-limiter.ts
│       └── cors.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-devices.ts
│   ├── use-notifications.ts
│   ├── use-pwa.ts
│   ├── use-fcm.ts
│   ├── use-session.ts
│   └── use-upload.ts
│
├── types/
│   ├── api/
│   │   ├── request.types.ts
│   │   ├── response.types.ts
│   │   └── error.types.ts
│   ├── models/
│   │   ├── device.types.ts
│   │   ├── notification.types.ts
│   │   └── admin.types.ts
│   ├── firebase/
│   │   └── fcm.types.ts
│   └── index.ts
│
├── validators/
│   ├── auth.validator.ts
│   ├── device.validator.ts
│   ├── notification.validator.ts
│   └── upload.validator.ts
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── device-tracker.ts
│   └── rate-limiter.middleware.ts
│
├── public/
│   ├── sw.js
│   ├── sw.js.map
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-192.svg
│   │   ├── icon-512.svg
│   │   └── apple-touch-icon.svg
│   └── images/
│
├── styles/
│   ├── globals.css
│   └── tailwind.css
│
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   ├── db-migrate.ts
│   └── db-seed.ts
│
├── .env.local.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md
└── ARCHITECTURE.md
```

## Module Breakdown

### 1. Admin Dashboard (`app/(admin)/admin/`)
| Directory | Purpose |
|-----------|---------|
| `login/` | Admin authentication page |
| `notifications/` | Notification management & history |
| `devices/` | Device monitoring & management |
| `settings/` | Admin configuration |
| `analytics/` | Reporting & statistics |

### 2. Authentication (`lib/auth/`, `app/api/admin/auth/`)
| File | Purpose |
|------|---------|
| `session.ts` | JWT token management |
| `middleware.ts` | Auth verification |
| `guards/admin.guard.ts` | Role-based access |
| `strategies/jwt.strategy.ts` | Token validation |

### 3. Notification Services (`lib/services/notification.service.ts`)
| Feature | Description |
|---------|-------------|
| Batch processing | 500 tokens per batch |
| Scheduling | Cron-based jobs |
| Retry logic | Exponential backoff |
| Analytics | Delivery tracking |

### 4. Service Worker (`public/sw.js`)
- Push event handling
- Notification display
- Offline caching
- Background sync

### 5. Push Subscription (`app/api/device/`)
| Endpoint | Description |
|----------|-------------|
| `register/` | Device token registration |
| `subscribe/` | Push subscription setup |
| `unsubscribe/` | Remove device |
| `update/` | Update device info |

### 6. Database Models (`lib/db/models/`)
| Model | Schema |
|-------|--------|
| `device.ts` | FCM tokens, platform, browser, metadata |
| `notification.ts` | Title, message, image, status |
| `admin.ts` | Users, roles, permissions |
| `scheduled.ts` | Timing, recurrence |

### 7. API Routes (`app/api/`)
- RESTful endpoints
- Request validation (Zod)
- Error handling
- Rate limiting

### 8. Image Upload (`app/api/upload/`)
| Component | Purpose |
|-----------|---------|
| `route.ts` | Upload handler |
| `validator.ts` | File validation |
| `storage.ts` | Cloud storage |

### 9. Middleware (`middleware/`)
| Middleware | Function |
|------------|----------|
| `auth.middleware.ts` | Verify admin session |
| `device-tracker.ts` | Track device activity |
| `rate-limiter.ts` | Prevent abuse |

### 10. Session Management (`lib/auth/session.ts`)
- JWT generation/verification
- Cookie management
- Session refresh
- Logout handling

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind v4 |
| Database | MongoDB + Mongoose |
| Push | Firebase Cloud Messaging |
| Auth | JWT + Cookies |
| Validation | Zod |
| PWA | Service Workers |
