# Production-Grade PWA Push Notification System - Folder Structure

## Complete Enterprise Architecture

```
bulk-notification-system/
│
├── app/                              # Next.js 16 App Router
│   ├── (admin)/                      # Admin routes group
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin layout with auth guard
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Admin login page
│   │   │   ├── notifications/
│   │   │   │   ├── page.tsx          # Notification history
│   │   │   │   ├── send/
│   │   │   │   │   └── page.tsx     # Send notification form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Notification details
│   │   │   ├── devices/
│   │   │   │   ├── page.tsx          # Device list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Device details
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # Admin settings
│   │   │   └── analytics/
│   │   │       └── page.tsx          # Notification analytics
│   │   └── layout.tsx                # Admin root layout
│   │
│   ├── api/                          # API Routes
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   ├── route.ts          # Login/logout/session
│   │   │   │   ├── middleware.ts     # Auth middleware
│   │   │   │   └── validator.ts     # Auth validators
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts          # CRUD operations
│   │   │   │   ├── send/
│   │   │   │   │   ├── route.ts      # Send notification
│   │   │   │   │   ├── validator.ts # Send validators
│   │   │   │   │   └── types.ts     # Request types
│   │   │   │   ├── schedule/
│   │   │   │   │   ├── route.ts     # Schedule notification
│   │   │   │   │   └── worker.ts    # Background scheduler
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts     # Get/update/delete
│   │   │   │   │   └── validator.ts # Notification validators
│   │   │   │   └── analytics/
│   │   │   │       └── route.ts     # Get analytics
│   │   │   ├── devices/
│   │   │   │   ├── route.ts         # Device CRUD
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts     # Device operations
│   │   │   │   │   └── validator.ts # Device validators
│   │   │   │   ├── stats/
│   │   │   │   │   └── route.ts     # Device statistics
│   │   │   │   └── cleanup/
│   │   │   │       └── route.ts    # Clean inactive devices
│   │   │   └── users/
│   │   │       ├── route.ts         # Admin user management
│   │   │       ├── create/
│   │   │       │   └── route.ts     # Create admin user
│   │   │       └── [id]/
│   │   │           └── route.ts     # Update/delete admin
│   │   │
│   │   ├── device/
│   │   │   ├── register/
│   │   │   │   ├── route.ts         # Register device
│   │   │   │   ├── validator.ts    # Registration validators
│   │   │   │   └── parser.ts       # Device info parser
│   │   │   ├── subscribe/
│   │   │   │   ├── route.ts        # Push subscription
│   │   │   │   └── service.ts      # Subscription service
│   │   │   ├── unsubscribe/
│   │   │   │   └── route.ts        # Unsubscribe device
│   │   │   ├── update/
│   │   │   │   └── route.ts        # Update device info
│   │   │   └── verify/
│   │   │       └── route.ts        # Verify device token
│   │   │
│   │   ├── upload/
│   │   │   ├── route.ts            # Image upload handler
│   │   │   ├── validator.ts        # Upload validators
│   │   │   ├── storage.ts          # Storage service
│   │   │   └── types.ts            # Upload types
│   │   │
│   │   ├── fcm/
│   │   │   ├── send/
│   │   │   │   ├── route.ts        # FCM send endpoint
│   │   │   │   ├── service.ts      # FCM service
│   │   │   │   ├── batch.ts        # Batch processing
│   │   │   │   └── retry.ts        # Retry logic
│   │   │   ├── token/
│   │   │   │   ├── validate.ts     # Validate tokens
│   │   │   │   └── refresh.ts      # Token refresh
│   │   │   └── health/
│   │   │       └── route.ts        # FCM health check
│   │   │
│   │   ├── scheduler/
│   │   │   ├── route.ts            # Scheduler API
│   │   │   ├── worker.ts           # Background worker
│   │   │   ├── queue.ts           # Job queue
│   │   │   └── types.ts           # Scheduler types
│   │   │
│   │   └── health/
│   │       ├── route.ts            # Health check
│   │       ├── readiness.ts        # Readiness probe
│   │       └── liveness.ts         # Liveness probe
│   │
│   ├── layout.tsx                  # Root layout with providers
│   ├── page.tsx                    # Public PWA landing
│   ├── manifest.json               # PWA manifest
│   └── not-found.tsx              # 404 page
│
├── components/                    # React Components
│   ├── ui/                        # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── pagination.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown.tsx
│   │   ├── tabs.tsx
│   │   └── form/
│   │       ├── form-field.tsx
│   │       ├── form-label.tsx
│   │       ├── form-error.tsx
│   │       └── form-context.tsx
│   │
│   ├── admin/                     # Admin components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── menu.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   ├── chart.tsx
│   │   │   └── activity-feed.tsx
│   │   ├── notifications/
│   │   │   ├── notification-form.tsx
│   │   │   ├── notification-list.tsx
│   │   │   ├── notification-item.tsx
│   │   │   ├── notification-preview.tsx
│   │   │   └── scheduler.tsx
│   │   ├── devices/
│   │   │   ├── device-list.tsx
│   │   │   ├── device-item.tsx
│   │   │   ├── device-filters.tsx
│   │   │   └── device-stats.tsx
│   │   └── auth/
│   │       ├── login-form.tsx
│   │       └── session-manager.tsx
│   │
│   ├── pwa/                       # PWA components
│   │   ├── firebase-provider.tsx
│   │   ├── install-prompt.tsx
│   │   ├── notification-permission.tsx
│   │   ├── device-registration.tsx
│   │   └── push-manager.tsx
│   │
│   └── shared/                    # Shared components
│       ├── loading.tsx
│       ├── error-boundary.tsx
│       └── lazy-load.tsx
│
├── lib/                           # Core Libraries
│   ├── db/                        # Database Layer
│   │   ├── connect.ts            # MongoDB connection
│   │   ├── connection-pool.ts    # Connection pooling
│   │   ├── transaction.ts        # Transaction helper
│   │   ├── index.ts             # Export barrel
│   │   ├── models/
│   │   │   ├── device.ts         # Device model
│   │   │   ├── notification.ts  # Notification model
│   │   │   ├── admin.ts         # Admin user model
│   │   │   ├── scheduled.ts      # Scheduled notification model
│   │   │   └── analytics.ts      # Analytics model
│   │   ├── schemas/             # Mongoose schemas
│   │   │   ├── device.schema.ts
│   │   │   ├── notification.schema.ts
│   │   │   └── admin.schema.ts
│   │   ├── repositories/        # Data access layer
│   │   │   ├── device.repository.ts
│   │   │   ├── notification.repository.ts
│   │   │   └── admin.repository.ts
│   │   └── types/              # Database types
│   │       └── index.ts
│   │
│   ├── firebase/                 # Firebase Services
│   │   ├── admin.ts             # Firebase Admin SDK
│   │   ├── client.ts           # Firebase Client SDK
│   │   ├── config.ts           # Firebase configuration
│   │   ├── messaging.ts        # FCM messaging service
│   │   ├── token-manager.ts    # Token management
│   │   ├── batch-sender.ts    # Batch sending
│   │   ├── retry-handler.ts   # Retry logic
│   │   └── types/             # Firebase types
│   │
│   ├── auth/                    # Authentication
│   │   ├── admin.ts            # Admin auth service
│   │   ├── session.ts          # Session management
│   │   ├── middleware.ts       # Auth middleware
│   │   ├── guards/            # Route guards
│   │   │   ├── admin.guard.ts
│   │   │   └── session.guard.ts
│   │   ├── strategies/        # Auth strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   └── cookie.strategy.ts
│   │   └── types/             # Auth types
│   │
│   ├── services/               # Business Logic Services
│   │   ├── notification.service.ts
│   │   ├── device.service.ts
│   │   ├── scheduler.service.ts
│   │   ├── analytics.service.ts
│   │   ├── upload.service.ts
│   │   └── fcm.service.ts
│   │
│   ├── utils/                  # Utilities
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── parser.ts          # User agent parser
│   │   ├── formatter.ts       # Date/number formatters
│   │   ├── logger.ts         # Logging utility
│   │   └── constants.ts
│   │
│   ├── config/                 # Configuration
│   │   ├── app.config.ts
│   │   ├── firebase.config.ts
│   │   ├── db.config.ts
│   │   └── env.config.ts
│   │
│   └── middleware/            # Custom Middleware
│       ├── auth.middleware.ts
│       ├── logger.middleware.ts
│       ├── rate-limiter.ts
│       └── cors.ts
│
├── hooks/                     # Custom React Hooks
│   ├── use-auth.ts
│   ├── use-devices.ts
│   ├── use-notifications.ts
│   ├── use-pwa.ts
│   ├── use-fcm.ts
│   ├── use-session.ts
│   └── use-upload.ts
│
├── types/                     # TypeScript Types
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
│   └── index.ts               # Main export
│
├── constants/                 # Application Constants
│   ├── api.constants.ts
│   ├── notification.constants.ts
│   ├── device.constants.ts
│   └── error.constants.ts
│
├── validators/                # Zod/Validation Schemas
│   ├── auth.validator.ts
│   ├── device.validator.ts
│   ├── notification.validator.ts
│   └── upload.validator.ts
│
├── middleware/                # Next.js Middleware
│   ├── auth.middleware.ts
│   ├── device-tracker.ts
│   └── rate-limiter.middleware.ts
│
├── public/                    # Static Assets
│   ├── sw.js                  # Service Worker
│   ├── sw.js.map
│   ├── manifest.json          # PWA Manifest
│   ├── icons/                 # PWA Icons
│   │   ├── icon-192.svg
│   │   ├── icon-512.svg
│   │   ├── apple-touch-icon.svg
│   │   └── badge.svg
│   ├── images/                # Static Images
│   ├── sounds/                # Notification Sounds
│   └── locales/               # i18n Files
│       ├── en.json
│       └── es.json
│
├── styles/                    # Styles
│   ├── globals.css            # Global styles
│   ├── tailwind.css           # Tailwind imports
│   └── components/            # Component styles
│       ├── admin.css
│       └── pwa.css
│
├── config/                    # Configuration Files
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   └── next-env.d.ts
│
├── scripts/                   # Build/Deploy Scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── db-migrate.ts
│   ├── db-seed.ts
│   └── generate-icons.ts
│
├── .env.local.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md
└── ARCHITECTURE.md
```

## Module Descriptions

### 1. Admin Dashboard (`app/(admin)/admin/`)
- Full-featured admin interface
- Notification creation and scheduling
- Device management and monitoring
- Analytics and reporting

### 2. Authentication (`lib/auth/`, `app/api/admin/auth/`)
- JWT-based session management
- Cookie-based authentication
- Role-based access control (RBAC)
- Session guards and middleware

### 3. Notification Services (`lib/services/notification.service.ts`, `app/api/admin/notifications/`)
- Send to all devices or targeted
- Batch processing (500 tokens/batch)
- Image attachment support
- Link embedding
- Scheduled notifications
- Retry logic for failed sends

### 4. Service Worker (`public/sw.js`)
- Push event handling
- Notification display
- Offline caching
- Background sync

### 5. Push Subscription (`app/api/device/`)
- Device registration
- Token management
- Subscription verification
- Automatic token refresh

### 6. Database Models (`lib/db/models/`)
- Device: FCM tokens, platform, browser, metadata
- Notification: Title, message, image, link, status
- ScheduledNotification: Timing, recurrence
- Admin: Username, password, role

### 7. API Routes (`app/api/`)
- RESTful endpoints
- Request validation
- Error handling
- Rate limiting

### 8. Image Upload (`app/api/upload/`)
- File validation
- Cloud storage integration
- Image optimization
- URL generation

### 9. Middleware (`middleware/`, `lib/middleware/`)
- Authentication verification
- Rate limiting
- Request logging
- Device tracking

### 10. Session Management (`lib/auth/session.ts`)
- JWT token generation
- Cookie management
- Session refresh
- Logout handling
