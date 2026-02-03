# Delivery Frontend

Angular 18 web application for the Delivery Management Platform.

## Features

- **Modern UI** - ng-bootstrap with responsive design
- **Real-time Updates** - Socket.IO for live order tracking
- **Role-based Views** - Different dashboards for Admin, Shop, Company, Driver
- **Maps Integration** - Google Maps for delivery tracking
- **i18n Support** - Internationalization ready
- **Theme Support** - Light/dark mode with customizable themes

## Prerequisites

- Node.js 18+
- Angular CLI 18+

## Installation

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Build for production
ng build --configuration=production
```

## Environment Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

## Project Structure

```
src/
 app/
    app.module.ts           # Root module
    app-routing.module.ts   # Main routes
    app-config.ts           # App configuration
   
    dashboard/              # Main dashboard modules
       admin/              # Admin management
       orders/             # Order management
       shops/              # Shop management
       companies/          # Company management
       drivers/            # Driver management
       users/              # User management
       shop-requests/      # Shop registration requests
       driver-requests/    # Driver registration requests
   
    shared/                 # Shared modules
       components/         # Reusable components
       services/           # API services
   
    theme/                  # Theme & layout
        layout/
            admin/
                navigation/ # Role-based navigation

 assets/                     # Static assets
    images/

 environments/               # Environment configs

 scss/                       # Global styles
     bootstrap/              # Bootstrap overrides
     fonts/                  # Custom fonts
     settings/               # SCSS variables
     themes/                 # Theme definitions
```

## User Roles & Navigation

### Admin (Role ID: 1)
- Dashboard with statistics
- Users management (CRUD)
- Shops management (CRUD)
- Companies management (CRUD)
- Drivers management (CRUD)
- All orders view
- Shop requests (approve/reject)
- Driver requests (approve/reject)
- Action logs
- API logs

### Shop (Role ID: 3)
- My Shop profile
- My Orders (create, view, edit, cancel)
- Order tracking
- Statistics

### Company (Role ID: 2)
- My Company profile
- My Drivers list
- Available Orders (from connected shops)
- Company Orders (taken orders)
- Driver assignment
- Shop Requests (request new shop connections)
- Driver Requests (request new drivers)

### Driver (Role ID: 4)
- My Profile
- My Deliveries (active orders)
- Delivery History
- Order status updates
- Location sharing

## Development

```bash
# Start dev server with hot reload
ng serve

# Run unit tests
ng test

# Run e2e tests
ng e2e

# Lint code
ng lint

# Generate component
ng generate component path/component-name
```

## Build

```bash
# Development build
ng build

# Production build
ng build --configuration=production

# Build with source maps
ng build --source-map
```

## License

Proprietary - All rights reserved
