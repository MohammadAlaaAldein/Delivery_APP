# Delivery API Backend

NestJS-based REST API server for the Delivery Management Platform.

## Features

- **RESTful API** - Comprehensive endpoints for all business operations
- **JWT Authentication** - Secure auth with refresh tokens and 2FA support
- **Real-time Updates** - Socket.IO WebSocket for live order tracking
- **Role-based Access** - Admin, Shop, Company, Driver permissions
- **Database** - PostgreSQL with TypeORM ORM
- **Caching** - Redis for session and performance optimization
- **Email** - EJS templates for transactional emails
- **Logging** - Action logs and API request logging

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your database and other settings in .env
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=delivery

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
PORT=3000
SITE_BASE_URL=http://localhost:4200

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

## Database Setup

```bash
# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed

# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName
```

## Running the Server

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/logout` | Logout (invalidate token) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/verify-login-otp-code` | Verify 2FA OTP |
| POST | `/api/v1/auth/resend-login-otp` | Resend 2FA OTP |

### Order Endpoints by Role

#### Shop Orders
- `POST /api/v1/orders/shop/create` - Create order
- `GET /api/v1/orders/shop/my` - List shop orders
- `GET /api/v1/orders/shop/my/:id` - Get order details
- `PATCH /api/v1/orders/shop/my/:id` - Update order
- `POST /api/v1/orders/shop/my/:id/cancel` - Cancel order

#### Company Orders
- `GET /api/v1/orders/company/available` - List available orders
- `POST /api/v1/orders/company/take/:id` - Take order
- `GET /api/v1/orders/company/my` - List company orders
- `POST /api/v1/orders/company/my/:id/assign-driver` - Assign driver
- `POST /api/v1/orders/company/my/:id/release` - Release order

#### Driver Orders
- `GET /api/v1/orders/driver/my` - List assigned deliveries
- `POST /api/v1/orders/driver/my/:id/pickup` - Mark picked up
- `POST /api/v1/orders/driver/my/:id/start-delivery` - Start delivery
- `POST /api/v1/orders/driver/my/:id/deliver` - Mark delivered
- `POST /api/v1/orders/driver/update-location` - Update GPS location

### WebSocket Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/orders', {
  auth: { token: 'Bearer <jwt_token>' }
});

// Listen for order events
socket.on('order_created', (order) => { ... });
socket.on('order_assigned_to_company', (order) => { ... });
socket.on('order_assigned_to_driver', (order) => { ... });
socket.on('order_picked_up', (order) => { ... });
socket.on('order_in_transit', (order) => { ... });
socket.on('order_delivered', (order) => { ... });
socket.on('order_cancelled', (order) => { ... });
socket.on('driver_location_updated', (location) => { ... });
```

## Project Structure

```
src/
 main.ts                 # Application entry point
 app.module.ts           # Root module
 config/
    data-source.ts      # TypeORM configuration
 common/
    api-response.ts     # Response helpers
    constants.ts        # App constants
    utilities.ts        # Utility functions
 decorators/
    version.decorator.ts
 interceptors/
    role-interceptor.ts # Role-based access
 modules/
    auth/               # Authentication
    users/              # User management
    shops/              # Shop management
    companies/          # Company management
    drivers/            # Driver management
    orders/             # Order management
       orders.controller.ts
       orders.service.ts
       orders.gateway.ts  # WebSocket
       entities/
    shop-requests/      # Shop registration
    driver-requests/    # Driver registration
    companies-shops/    # Shop-Company relations
    ...
 view/                   # Email templates
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

Proprietary - All rights reserved
