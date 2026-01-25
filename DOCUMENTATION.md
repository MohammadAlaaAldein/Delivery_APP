# 📦 Delivery App - Project Documentation

## 🏢 Business Overview

### What is the Delivery App?
The **Delivery App** is a comprehensive delivery management system designed to coordinate the relationship between **Shops** (merchants/stores), **Companies** (delivery service providers), and **Drivers** (delivery personnel). It provides a centralized platform for managing delivery operations.

### Business Model

```
┌─────────────┐     Many-to-Many      ┌──────────────┐
│    SHOPS    │◄─────────────────────►│  COMPANIES   │
│ (Merchants) │                       │(Delivery Co.)│
└─────────────┘                       └──────────────┘
                                              │
                                              │ One-to-Many
                                              ▼
                                       ┌─────────────┐
                                       │   DRIVERS   │
                                       │(Delivery    │
                                       │ Personnel)  │
                                       └─────────────┘
```

### Key Business Entities

| Entity | Description | Role |
|--------|-------------|------|
| **Shop** | Merchants/Stores that need delivery services | Orders products to be delivered |
| **Company** | Delivery service providers | Provides drivers and delivery services |
| **Driver** | Delivery personnel with vehicles | Executes the actual delivery |
| **User** | System user with specific roles | Manages operations based on role |

### User Roles

| Role | Access Level | Description | Dashboard |
|------|--------------|-------------|----------|
| `admin` | Full Access | System administrator with access to all features | Full admin panel |
| `shop` | Limited | Shop manager - can view/edit their shop profile | My Shop dashboard |
| `company` | Limited | Company manager - can manage company profile and view drivers | My Company + My Drivers |
| `driver` | Limited | Driver - can view/edit their profile | My Profile dashboard |

### Business Relationships

1. **Shops ↔ Companies**: Many-to-many relationship via `companies_shops` junction table
   - A shop can work with multiple delivery companies
   - A company can serve multiple shops

2. **Companies → Drivers**: One-to-many relationship
   - A company has multiple drivers
   - A driver belongs to one company (via `company_id`)

3. **Users → Drivers**: One-to-one relationship
   - A user with role `driver` automatically gets a driver record created
   - Driver profile extends user with vehicle/license information

---

## 🛠️ Technical Architecture

### Technology Stack

#### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | Main backend framework |
| TypeORM | 0.3.x | ORM for database operations |
| PostgreSQL | - | Primary database |
| Redis | - | Caching & session management |
| Fastify | - | HTTP server (replacing Express) |
| JWT | - | Authentication tokens |
| Passport | - | Authentication strategies |
| @nestjs/event-emitter | - | Event-driven architecture |

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 18.x | Frontend framework |
| Bootstrap | 5.x | UI components |
| ng-select | 13.x | Dropdown components |
| @ngx-translate | 16.x | Internationalization |
| ApexCharts | - | Data visualization |

### Project Structure

```
delivery/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── common/             # Shared utilities, constants
│   │   ├── config/             # Database configuration
│   │   ├── decorators/         # Custom decorators
│   │   ├── http-exception/     # Error handling
│   │   ├── interceptors/       # Request interceptors
│   │   └── modules/            # Feature modules
│   │       ├── action-log/     # Audit logging
│   │       ├── api-logs/       # API request logging
│   │       ├── attachments/    # File management
│   │       ├── auth/           # Authentication
│   │       ├── companies/      # Company management
│   │       ├── companies-shops/# Junction table service
│   │       ├── drivers/        # Driver management
│   │       ├── files/          # File handling
│   │       ├── mailers/        # Email services
│   │       ├── redis/          # Redis service
│   │       ├── schedule/       # Scheduled tasks
│   │       ├── shops/          # Shop management
│   │       └── users/          # User management
│   └── view/                   # Email templates (EJS)
│
├── frontend/                   # Angular Frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/      # Feature components
│       │   │   ├── admin/      # Admin tools
│       │   │   ├── companies/  # Company pages
│       │   │   ├── dashboard/  # Main dashboard
│       │   │   ├── drivers/    # Driver pages
│       │   │   ├── logs/       # Log viewers
│       │   │   ├── shops/      # Shop pages
│       │   │   └── users/      # User pages
│       │   ├── shared/         # Shared components
│       │   └── theme/          # Layout components
│       └── scss/               # Styling
│
└── shared/                     # Shared across FE/BE
    ├── translation/            # i18n files (en.json)
    └── validation/             # Validation rules
```

---

## 📊 Database Schema

### Entity Relationship Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                         USERS                                  │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ name: varchar(256)                                             │
│ email: varchar(256) UNIQUE                                     │
│ password: text                                                 │
│ is_active: boolean                                             │
│ role: enum (admin, shop, company, driver)                      │
│ entity_id: integer (FK → shops.id OR companies.id based on role)│
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘
            │
            │ (1:1 when role='driver')
            ▼
┌───────────────────────────────────────────────────────────────┐
│                        DRIVERS                                 │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ user_id: integer UNIQUE (FK → users.id)                        │
│ is_active: boolean                                             │
│ company_id: integer (FK → companies.id)                        │
│ ─── Personal Info ───                                          │
│ national_id: varchar(50)                                       │
│ birth_date: date                                               │
│ phone: varchar(20)                                             │
│ city: varchar(100)                                             │
│ personal_image: varchar(500) [TODO]                            │
│ ─── License Info ───                                           │
│ license_number: varchar(50)                                    │
│ license_expiry_date: date                                      │
│ license_image: varchar(500) [TODO]                             │
│ ─── Vehicle Info ───                                           │
│ vehicle_type: enum (car, motorcycle, truck, van, bicycle)      │
│ vehicle_brand: varchar(100)                                    │
│ vehicle_model: varchar(100)                                    │
│ vehicle_year: integer                                          │
│ vehicle_color: varchar(50)                                     │
│ plate_number: varchar(20)                                      │
│ vehicle_image: varchar(500) [TODO]                             │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                         SHOPS                                  │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ name: varchar(256)                                             │
│ is_active: boolean                                             │
│ ─── Location Info ───                                          │
│ city: varchar(100) [Jordan cities]                             │
│ area: varchar(100)                                             │
│ street: varchar(255)                                           │
│ building: varchar(100)                                         │
│ latitude: decimal(10,7)                                        │
│ longitude: decimal(10,7)                                       │
│ address: text                                                  │
│ ─── Contact Info ───                                           │
│ phone: varchar(30)                                             │
│ whatsapp: varchar(30)                                          │
│ email: varchar(255)                                            │
│ ─── License Info ───                                           │
│ license_number: varchar(100)                                   │
│ license_type: varchar(100)                                     │
│ license_expiry_date: date                                      │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘
            │
            │ (M:N via companies_shops)
            ▼
┌───────────────────────────────────────────────────────────────┐
│                    COMPANIES_SHOPS                             │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ company_id: integer (FK → companies.id)                        │
│ shop_id: integer (FK → shops.id)                               │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘
            │
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                       COMPANIES                                │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ name: varchar(256)                                             │
│ is_active: boolean                                             │
│ ─── Location Info ───                                          │
│ city: varchar(100) [Jordan cities]                             │
│ address: text                                                  │
│ ─── Contact Info ───                                           │
│ phone: varchar(30)                                             │
│ email: varchar(255)                                            │
│ website: varchar(255)                                          │
│ ─── Company Info ───                                           │
│ company_type: varchar(50)                                      │
│ ─── License Info ───                                           │
│ license_number: varchar(100)                                   │
│ license_expiry_date: date                                      │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘
```

### Jordan Cities (Supported)
- Amman, Irbid, Zarqa, Balqa, Mafraq, Jerash, Ajloun, Madaba, Karak, Tafilah, Ma'an, Aqaba

### Supporting Tables

```
┌───────────────────────────────────────────────────────────────┐
│                      ACTION_LOGS                               │
├───────────────────────────────────────────────────────────────┤
│ Audit trail of user actions (login, CRUD operations, etc.)     │
│ Stores old_values, new_values, action_name, user info          │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                        API_LOGS                                │
├───────────────────────────────────────────────────────────────┤
│ HTTP request logging for debugging                             │
│ Stores endpoint, body, query params, user_id                   │
└───────────────────────────────────────────────────────────────┘
```

### Request Tables (for approval workflow)

```
┌───────────────────────────────────────────────────────────────┐
│                     SHOPS_REQUESTS                             │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ requesting_company_id: integer (FK → companies.id)             │
│ status: enum (pending, approved, rejected)                     │
│ ─── Shop Fields (same as SHOPS) ───                            │
│ name, city, area, street, building, latitude, longitude,       │
│ address, phone, whatsapp, email, license_number, license_type, │
│ license_expiry_date                                            │
│ ─── Admin Fields ───                                           │
│ admin_notes: text                                              │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    DRIVERS_REQUESTS                            │
├───────────────────────────────────────────────────────────────┤
│ id (PK)                                                        │
│ requesting_company_id: integer (FK → companies.id)             │
│ status: enum (pending, approved, rejected)                     │
│ ─── Driver Fields ───                                          │
│ name, email, national_id, birth_date, phone, city,             │
│ personal_image, license_number, license_expiry_date,           │
│ license_image, vehicle_type, vehicle_brand, vehicle_model,     │
│ vehicle_year, vehicle_color, plate_number, vehicle_image       │
│ ─── Admin Fields ───                                           │
│ admin_notes: text                                              │
│ created_at, updated_at, deleted_at                             │
└───────────────────────────────────────────────────────────────┘
```

#### Request Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ SHOP/DRIVER REQUEST WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ COMPANY USER (via /my-shop-requests or /my-driver-requests):     │
│   ├─► Create: Submit new shop/driver request → status = 'pending'│
│   ├─► View: See list of their submitted requests                 │
│   ├─► Edit: Modify pending or rejected requests                  │
│   ├─► Delete: Remove pending or rejected requests                │
│   └─► Resubmit: Edit and save rejected request to resubmit       │
│                                                                  │
│ ADMIN USER (via /shop-requests or /driver-requests):             │
│   ├─► Edit request fields (pending or rejected status)           │
│   ├─► View approved requests (readonly)                          │
│   ├─► APPROVE:                                                   │
│   │     ├─ Shop Request → Creates new Shop + companies_shops link│
│   │     └─ Driver Request → Creates User (role=driver) + Driver  │
│   │         └─ Returns temp password for driver account          │
│   │     └─ Request record is DELETED after approval              │
│   └─► REJECT:                                                    │
│         └─ Status changes to 'rejected' with admin_notes         │
│         └─ Company can view rejection reason and resubmit        │
│                                                                  │
│ Status-Based Access:                                             │
│   ├─► pending: Admin/Company can edit, Company can delete        │
│   ├─► rejected: Admin/Company can edit, Company can delete       │
│   └─► approved: Read-only for all (request deleted after)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### JWT-Based Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────┤
│ 1. User submits email + password                             │
│ 2. Server validates credentials                              │
│ 3. Server generates access token (1 hour) + refresh token (7d)│
│ 4. Session stored in Redis                                   │
│ 5. Tokens returned to client                                 │
│ 6. Client stores tokens in localStorage                      │
│ 7. Access token attached to all API requests                 │
└─────────────────────────────────────────────────────────────┘
```

### Token Configuration
- **Access Token TTL**: 1 hour (3600 seconds)
- **Refresh Token TTL**: 7 days
- **Session Management**: Redis-based

### Security Features
- Password hashing with bcrypt
- OTP/2FA verification via email
- Account blocking after failed login attempts
- IP whitelisting support
- Captcha validation

### RoleInterceptor

The unified `RoleInterceptor` handles both role validation and entity ownership checks:

```typescript
// Single role
@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))

// Multiple roles
@UseInterceptors(new RoleInterceptor([USER_ROLE.ADMIN, USER_ROLE.COMPANY]))

// With entity ownership (for "my" endpoints)
@UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))

// With same entity validation (for param-based endpoints)
@UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { allowSameEntity: true }))
```

**Options:**
- `requireEntityOwnership`: Requires user to have an `entity_id` (for "my" endpoints)
- `allowSameEntity`: Validates that user's `entity_id` matches the resource ID from params

> **Note**: Admin users bypass all role checks automatically.

---

## 🔄 Key Business Logic

### Driver Creation Flow

```
┌────────────────────────────────────────────────────────────────┐
│ When creating/updating a User:                                  │
│                                                                 │
│ IF user.role === 'driver':                                      │
│   ├─ Check if Driver record exists for user_id                  │
│   │   ├─ IF EXISTS: Update company_id from user.entity_id       │
│   │   └─ IF NOT EXISTS: Create new Driver with:                 │
│   │       ├─ user_id = user.id                                  │
│   │       └─ company_id = user.entity_id                        │
│   │                                                             │
│ IF user.role CHANGED from 'driver' to another:                  │
│   └─ Remove company_id from Driver record (set to null)         │
└────────────────────────────────────────────────────────────────┘
```

### Active Entity Filtering
- All dropdown selections show only **active** entities (`is_active: true`)
- Toggle active/inactive available for: Users, Shops, Companies, Drivers
- Soft delete implemented via `deleted_at` column

---

## 📱 Frontend Features

### Navigation Structure

The navigation menu (nav-right dropdown) shows different sections based on user role:

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN USER                                                   │
├─────────────────────────────────────────────────────────────┤
│ Users Management    │ Shops Management   │ Companies Mgmt   │
│ ├── Users List      │ ├── Shops List     │ ├── Companies    │
│ └── Create User     │ └── Create Shop    │ └── Create Co.   │
│                     │                    │                   │
│ Drivers Management  │ Requests Mgmt      │ Admin Tools       │
│ └── Drivers List    │ ├── Shop Requests  │ ├── Action Log   │
│                     │ └── Driver Requests│ └── API Logs     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SHOP USER                                                    │
├─────────────────────────────────────────────────────────────┤
│ My Shop                                                      │
│ └── /my-shop (View/Edit shop profile)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ COMPANY USER                                                 │
├─────────────────────────────────────────────────────────────┤
│ My Company                                                   │
│ ├── /my-company (View/Edit company profile)                  │
│ ├── /my-drivers (View company's drivers - read-only)         │
│ ├── /my-shop-requests (Request new shops)                    │
│ └── /my-driver-requests (Request new drivers)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DRIVER USER                                                  │
├─────────────────────────────────────────────────────────────┤
│ My Profile                                                   │
│ └── /my-profile (View/Edit driver profile)                   │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Routes

| Route | Component | Role | Description |
|-------|-----------|------|-------------|
| `/dashboard` | DashboardComponent | All | Main dashboard |
| `/my-shop` | ShopDashboardComponent | Shop | Edit shop profile |
| `/my-company` | CompanyDashboardComponent | Company | Edit company profile |
| `/my-drivers` | CompanyDriversComponent | Company | View company's drivers |
| `/my-shop-requests` | MyShopRequestsComponent | Company | List shop requests |
| `/my-shop-requests/create` | MyShopRequestFormComponent | Company | Create shop request |
| `/my-shop-requests/edit/:id` | MyShopRequestFormComponent | Company | Edit shop request |
| `/my-driver-requests` | MyDriverRequestsComponent | Company | List driver requests |
| `/my-driver-requests/create` | MyDriverRequestFormComponent | Company | Create driver request |
| `/my-driver-requests/edit/:id` | MyDriverRequestFormComponent | Company | Edit driver request |
| `/my-profile` | DriverDashboardComponent | Driver | Edit driver profile |
| `/users` | UsersComponent | Admin | Users list |
| `/users/create` | CreateUserComponent | Admin | Create user |
| `/users/edit/:id` | CreateUserComponent | Admin | Edit user |
| `/shops` | ShopsComponent | Admin | Shops list |
| `/shops/create` | CreateShopComponent | Admin | Create shop |
| `/shops/edit/:id` | CreateShopComponent | Admin | Edit shop |
| `/companies` | CompaniesComponent | Admin | Companies list |
| `/companies/create` | CreateCompanyComponent | Admin | Create company |
| `/companies/edit/:id` | CreateCompanyComponent | Admin | Edit company |
| `/drivers` | DriversComponent | Admin | Drivers list |
| `/drivers/edit/:id` | CreateDriverComponent | Admin | Edit driver |
| `/shop-requests` | ShopRequestsComponent | Admin | Shop requests list |
| `/shop-requests/edit/:id` | ShopRequestFormComponent | Admin | Edit shop request |
| `/driver-requests` | DriverRequestsComponent | Admin | Driver requests list |
| `/driver-requests/edit/:id` | DriverRequestFormComponent | Admin | Edit driver request |
| `/action-log` | ActionLogComponent | Admin | Action logs viewer |
| `/api-logs` | ApiLogsComponent | Admin | API logs viewer |

### Role-Based Access Control
- `RoleAccessGuard` protects routes based on user role
- `RoleInterceptor` on backend validates role and entity ownership
- Non-admin users are redirected to their respective dashboards on login
- Admin has full system access

---

## 🚀 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh` | Refresh access token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| GET | `/users/:id` | Get user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PUT | `/users/:id/toggle-active` | Toggle active status |

### Shops
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shops` | List shops |
| POST | `/shops` | Create shop |
| GET | `/shops/:id` | Get shop |
| PUT | `/shops/:id` | Update shop |
| DELETE | `/shops/:id` | Delete shop |
| PUT | `/shops/:id/toggle-active` | Toggle active status |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Get company |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |
| PUT | `/companies/:id/toggle-active` | Toggle active status |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers` | List drivers |
| GET | `/drivers/:id` | Get driver |
| PUT | `/drivers/:id` | Update driver |
| DELETE | `/drivers/:id` | Delete driver |
| PUT | `/drivers/:id/toggle-active` | Toggle active status |

> **Note**: Drivers are NOT created directly via API. They are automatically created when a User is assigned the `driver` role.

### Role-Based "My" Endpoints
These endpoints are protected by `RoleInterceptor` with `requireEntityOwnership: true`.

#### Shop User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shops/my` | Get current user's shop profile |
| PATCH | `/shops/my` | Update current user's shop profile |

#### Company User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies/my` | Get current user's company profile |
| PATCH | `/companies/my` | Update current user's company profile |
| GET | `/companies/my/drivers` | Get drivers belonging to user's company |

#### Driver User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers/my` | Get current user's driver profile |
| PATCH | `/drivers/my` | Update current user's driver profile |

> **Note**: These endpoints use the `entity_id` from the JWT token to identify the resource. Shop/Company users cannot modify their associated entities (company_ids/shop_ids).

### Shop Requests (Approval Workflow)

#### Company Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/shop-requests/my/add` | Create a new shop request |
| GET | `/shop-requests/my` | List company's own shop requests |
| PATCH | `/shop-requests/my/:id` | Update own shop request (pending/rejected only) |
| DELETE | `/shop-requests/my/:id` | Delete own shop request (pending/rejected only) |

#### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shop-requests/list` | List all shop requests |
| PATCH | `/shop-requests/:id` | Update shop request (pending/rejected only) |
| POST | `/shop-requests/:id/approve` | Approve request (creates shop) |
| POST | `/shop-requests/:id/reject` | Reject request (with admin_notes) |
| DELETE | `/shop-requests/:id` | Delete request |

### Driver Requests (Approval Workflow)

#### Company Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/driver-requests/my/add` | Create a new driver request |
| GET | `/driver-requests/my` | List company's own driver requests |
| PATCH | `/driver-requests/my/:id` | Update own driver request (pending/rejected only) |
| DELETE | `/driver-requests/my/:id` | Delete own driver request (pending/rejected only) |

#### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver-requests/list` | List all driver requests |
| PATCH | `/driver-requests/:id` | Update driver request (pending/rejected only) |
| POST | `/driver-requests/:id/approve` | Approve request (creates user + driver) |
| POST | `/driver-requests/:id/reject` | Reject request (with admin_notes) |
| DELETE | `/driver-requests/:id` | Delete request |

> **Note**: When a driver request is approved, a new user account is created with a temporary password. The admin should share this password with the driver, who can then change it upon first login.

### Request Status Behavior

| Status | Company Actions | Admin Actions | Form Mode |
|--------|----------------|---------------|-----------|
| `pending` | Edit, Delete | Edit, Approve, Reject | Editable |
| `rejected` | Edit (resubmit), Delete | Edit, Approve, Reject | Editable |
| `approved` | View only | View only | Read-only |

> **Note**: When a request is approved, the request record is automatically deleted after creating the actual entity (shop/driver). Rejected requests remain in the system so companies can view the rejection reason and resubmit.

---

## 📋 Current Implementation Status

### ✅ Completed Features
- [x] User authentication (login, logout, password reset)
- [x] User CRUD with role management
- [x] Shop CRUD with company relationships
- [x] Company CRUD with shop relationships
- [x] Driver CRUD with vehicle/license info
- [x] Active/Inactive toggle for all entities
- [x] Audit logging (action_logs)
- [x] API request logging
- [x] Role-based access control
- [x] i18n translations (English)
- [x] Shop extended fields (location, contact, license info)
- [x] Company extended fields (location, contact, license info)
- [x] Jordan cities support (Amman, Irbid, Zarqa, etc.)
- [x] Role-based dashboards (My Shop, My Company, My Profile)
- [x] "My" API endpoints for shop/company/driver users
- [x] Company drivers view (separate component)
- [x] Entity names returned from backend (shop_names, company_names)
- [x] Unified RoleInterceptor with multi-role support
- [x] Shop request system (companies request new shops)
- [x] Driver request system (companies request new drivers)
- [x] Request approval/rejection workflow for admins

### 🚧 TODO / In Progress
- [ ] File upload for driver images (personal, license, vehicle)
- [ ] Email notification system (mailers module commented out)
- [ ] Sentry error tracking (commented out)
- [ ] Full action logging integration
- [ ] Orders module (not yet implemented)
- [ ] Delivery tracking (not yet implemented)
- [ ] Mobile app for drivers

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis

### Environment Variables

Create a `.env` file in the backend folder:

```env
# Server
SERVER=development
SERVER_PRETTY_NAME=Development
BASE_URL=http://localhost:1000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=delivery_app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET_TOKEN=your_jwt_secret
JWT_REFRESH_SECRET_TOKEN=your_refresh_secret

# Mailer (Optional)
MAILER_HOST=smtp.example.com
MAILER_PORT=587
```

### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

### Database Migrations
```bash
cd backend
npm run migration:run
```

---

## 📝 Code Conventions

### Backend
- **Module Structure**: Each feature has its own module with controller, service, entities, and DTOs
- **Naming**: snake_case for database columns, camelCase for TypeScript
- **Validation**: Class-validator decorators in DTOs
- **Error Handling**: Custom HTTP exception filter

### Frontend
- **Components**: Standalone components (Angular 18+)
- **State Management**: Services with BehaviorSubject
- **Styling**: SCSS with Bootstrap 5
- **Translations**: ngx-translate with JSON files

---

## 👨‍💻 Author

**Mohammad Alaa Aldein**

---

## 📄 License

This project is proprietary software.

---

*Last Updated: January 25, 2025*
