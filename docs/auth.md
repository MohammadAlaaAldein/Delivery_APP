# 🔐 Authentication & API Routes

### Auth Mechanism
- JWT-Based: Access Token (1 hour), Refresh Token (7 days). Session stored in Redis.
- Guards & Interceptors: `RoleInterceptor` validates roles and ownership (`requireEntityOwnership`, `allowSameEntity`). Admins bypass checks.

### Core Endpoints
- `/auth`: `/login`, `/logout`, `/refresh`
- `/users`, `/shops`, `/companies`, `/drivers`: CRUD + `/toggle-active`
- `/shops/my`, `/companies/my`, `/drivers/my`: Role-based profile management.
- `/shop-requests`, `/driver-requests`: Company endpoints (`/my/add`, `/my`) & Admin endpoints (`/list`, `/:id/approve`, `/:id/reject`).
- `/push-notifications`: `/register`, `/unregister`, `/subscribe/:topic`