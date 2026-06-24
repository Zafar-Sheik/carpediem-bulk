# PWA Notification Broadcasting System - Architecture Document

## 1. System Overview

### 1.1 System Description
A Progressive Web App (PWA) notification broadcasting system that allows an admin to send push notifications to all registered devices. The system uses Firebase Cloud Messaging (FCM) for push notifications, MongoDB for data persistence, and Next.js 16 with App Router for the web framework.

### 1.2 Key Features
- **PWA Support**: Installable on mobile and desktop devices
- **Push Notifications**: Send notifications via FCM to all registered devices
- **Admin Dashboard**: Single admin interface for broadcasting notifications
- **Device Registration**: Automatic device token registration on app open
- **Scheduled Notifications**: Support for future-dated notifications
- **Image Attachments**: Support for notification images

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PWA Notification System                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────┐ │
│  │   Admin Browser │         │  User Devices   │         │   MongoDB   │ │
│  │   (Dashboard)   │         │   (PWA App)     │         │  Database   │ │
│  └────────┬────────┘         └────────┬────────┘         └──────┬──────┘ │
│           │                           │                           │        │
│           │                           │                           │        │
│           ▼                           ▼                           ▼        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Next.js 16 App Router                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ Admin Routes │  │ API Routes   │  │ Public Routes│            │   │
│  │  │   /admin     │  │  /api/admin  │  │     /        │            │   │
│  │  │   /login     │  │  /api/device │  │  /subscribe  │            │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Firebase Cloud Messaging                        │   │
│  │                  (Push Notification Service)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DEVICE REGISTRATION FLOW:                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │  User  │───▶│  Open   │───▶│ Request │───▶│  Store  │───▶│  Save   │ │
│  │Device  │    │   PWA   │    │ Permission│  │   FCM   │    │  Token  │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘ │
│                                                                    │       │
│                                                                    ▼       │
│                                                            ┌─────────────┐ │
│                                                            │   MongoDB   │ │
│                                                            │  Devices    │ │
│                                                            │  Collection │ │
│                                                            └─────────────┘ │
│                                                                             │
│  NOTIFICATION SENDING FLOW:                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │  Admin │───▶│  Fill   │───▶│  Send   │───▶│  Fetch  │───▶│  Send   │ │
│  │        │    │  Form   │    │ Request │    │  Tokens │    │  to FCM │ │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘    └────┬────┘ │
│                                                    │              │       │
│                                                    ▼              ▼       │
│                                            ┌─────────────┐  ┌─────────┐ │
│                                            │   MongoDB   │  │ Firebase│ │
│                                            │  Devices    │  │   FCM   │ │
│                                            └─────────────┘  └────┬────┘ │
│                                                                  │       │
│                                                                  ▼       │
│  SCHEDULED NOTIFICATIONS:                                       ┌─────────┐ │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │  Push  │ │
│  │  Admin │───▶│ Schedule│───▶│  Store  │───▶│  Cron   │───────▶│  to    │ │
│  │        │    │   Job   │    │Scheduled│    │  Job    │        │ Devices│ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘        └─────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NOTIFICATION FLOW DIAGRAM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ADMIN COMPOSES NOTIFICATION                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Title: "New Update Available"                                      │   │
│  │  Message: "Check out our new features!"                            │   │
│  │  Image: [Upload] (optional)                                        │   │
│  │  Link: "https://example.com/update" (optional)                    │   │
│  │  Schedule: [Now] or [Select Date/Time]                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  2. API RECEIVES REQUEST                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/admin/notifications/send                                │   │
│  │  - Validate admin session                                          │   │
│  │  - Validate notification payload                                   │   │
│  │  - If scheduled, save to database                                   │   │
│  │  - If immediate, fetch all device tokens                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                      │
│                    ▼                               ▼                      │
│  3A. IMMEDIATE NOTIFICATION    3B. SCHEDULED NOTIFICATION                  │
│  ┌─────────────────────────┐   ┌─────────────────────────────────────────┐│
│  │  Fetch all FCM tokens   │   │  Store in ScheduledNotifications       ││
│  │  from MongoDB           │   │  collection with scheduledAt timestamp ││
│  └────────────┬────────────┘   └────────────────────────┬────────────────┘│
│               │                                          │                │
│               ▼                                          │                │
│  ┌─────────────────────────┐                            │                │
│  │  Send to Firebase FCM   │                            │                │
│  │  (Batch of 500 tokens)  │                            │                │
│  └────────────┬────────────┘                            │                │
│               │                                          │                │
│               ▼                                          │                │
│  ┌─────────────────────────┐                            │                │
│  │  Firebase sends to      │                            │                │
│  │  all registered devices│                            │                │
│  └─────────────────────────┘                            │                │
│                                                          │                │
│               ◀───────────────────────────▲              │                │
│               │                           │              │                │
│               ▼                           │              │                │
│  ┌─────────────────────────┐              │              │                │
│  │  Save to Notification   │◀─────────────┴──────────────┘                │
│  │  History in MongoDB     │                                            │
│  └─────────────────────────┘                                            │
│                                    │                                        │
│                                    ▼                                        │
│  4. DEVICE RECEIVES NOTIFICATION                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  Service    │  │  Push Event │  │  Display   │                 │   │
│  │  │  Worker     │──▶│  Received  │──▶│ Notification│                │   │
│  │  │  (sw.js)    │  │             │  │             │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
bulk-notification-new/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Admin layout with auth check
│   │   │   ├── page.tsx            # Admin dashboard home
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Admin login page
│   │   │   ├── notifications/
│   │   │   │   ├── page.tsx        # Notification history
│   │   │   │   └── send/
│   │   │   │       └── page.tsx    # Send notification form
│   │   │   └── devices/
│   │   │       └── page.tsx        # Device list
│   │   └── layout.tsx              # Admin root layout
│   ├── api/
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   └── route.ts         # Admin authentication
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts        # Notification CRUD
│   │   │   │   ├── send/
│   │   │   │   │   └── route.ts     # Send notification
│   │   │   │   └── schedule/
│   │   │   │       └── route.ts     # Schedule notification
│   │   │   └── devices/
│   │   │       └── route.ts         # Device management
│   │   ├── device/
│   │   │   ├── register/
│   │   │   │   └── route.ts         # Device registration
│   │   │   └── subscribe/
│   │   │       └── route.ts         # Push subscription
│   │   └── fcm/
│   │       └── send/
│   │           └── route.ts         # FCM send API
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.json                 # PWA manifest
│   └── page.tsx                      # Public PWA landing page
├── components/
│   ├── ui/                           # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── toast.tsx
│   ├── admin/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── notification-form.tsx
│   └── pwa/
│       ├── install-prompt.tsx
│       └── notification-permission.tsx
├── lib/
│   ├── db/
│   │   ├── connect.ts               # MongoDB connection
│   │   ├── models/
│   │   │   ├── Device.ts             # Device model
│   │   │   ├── Notification.ts       # Notification model
│   │   │   └── ScheduledNotification.ts
│   │   └── index.ts
│   ├── firebase/
│   │   ├── admin.ts                 # Firebase admin SDK
│   │   ├── config.ts                # Firebase config
│   │   └── messaging.ts             # FCM messaging functions
│   ├── auth/
│   │   └── admin.ts                 # Admin auth utilities
│   └── utils/
│       └── helpers.ts
├── public/
│   ├── sw.js                        # Service worker
│   ├── sw.js.map
│   ├── workbox-*.js                 # Workbox build files
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   └── images/
│       └── notification-default.png
├── styles/
│   └── globals.css                  # Global styles
├── types/
│   └── index.ts                     # TypeScript types
├── .env.local                       # Environment variables
├── next.config.ts                   # Next.js config
├── tailwind.config.ts               # Tailwind config
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Database Schema

### 6.1 Device Collection
```javascript
{
  _id: ObjectId,
  fcmToken: String,           // Firebase Cloud Messaging token
  deviceInfo: {
    platform: String,        // 'android', 'ios', 'windows', 'mac', 'linux'
    browser: String,         // 'chrome', 'firefox', 'safari', 'edge'
    userAgent: String,
    language: String
  },
  metadata: {
    appVersion: String,
    lastSeen: Date,
    createdAt: Date,
    isActive: Boolean
  }
}
```

### 6.2 Notification Collection
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  image: String,              // URL to image
  link: String,               // URL to open on click
  sentAt: Date,
  scheduledAt: Date,         // If scheduled
  status: String,            // 'sent', 'pending', 'failed', 'scheduled'
  recipientCount: Number,
  createdBy: String,          // Admin ID
  createdAt: Date
}
```

### 6.3 Admin Collection
```javascript
{
  _id: ObjectId,
  username: String,
  passwordHash: String,
  role: String,               // 'admin', 'superadmin'
  createdAt: Date,
  lastLogin: Date
}
```

---

## 7. API Endpoints

### 7.1 Device Registration
- `POST /api/device/register` - Register device with FCM token
- `GET /api/device/subscribe` - Get push subscription options

### 7.2 Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/session` - Check session status

### 7.3 Admin Notifications
- `POST /api/admin/notifications/send` - Send notification to all devices
- `GET /api/admin/notifications` - Get notification history
- `POST /api/admin/notifications/schedule` - Schedule notification

### 7.4 Admin Devices
- `GET /api/admin/devices` - List all registered devices

---

## 8. Security Considerations

1. **Admin Authentication**: Session-based authentication with secure cookies
2. **API Security**: Admin routes require authentication middleware
3. **FCM Token Security**: Tokens stored securely, not exposed in API responses
4. **Rate Limiting**: Implement rate limiting on notification sending
5. **Input Validation**: Validate all inputs on server-side
6. **Environment Variables**: Never commit sensitive data to version control

---

## 9. PWA Requirements

1. **Manifest**: Include web app manifest with icons and theme
2. **Service Worker**: Register service worker for offline support
3. **Push Manager**: Request notification permission on first visit
4. **Install Prompt**: Custom install prompt for better UX
5. **Offline Support**: Cache static assets and show offline page

---

## 10. Firebase Configuration

### 10.1 Firebase Admin SDK
- Initialize with service account credentials
- Use for sending push notifications
- Manage device tokens

### 10.2 Firebase Web SDK
- Use for client-side FCM token generation
- Handle push subscription
- Service worker registration

---

## 11. Environment Variables

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/bulk-notification

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Firebase Web (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Admin Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=bcrypt-hash
JWT_SECRET=your-jwt-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
