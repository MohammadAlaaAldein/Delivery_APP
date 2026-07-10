# 📊 Database Schema & Tables

### Core Tables
- **USERS**: `id` (PK), `name`, `email` (UNIQUE), `password`, `is_active`, `role` (enum), `entity_id` (FK to shops/companies).
- **DRIVERS**: `id` (PK), `user_id` (UNIQUE FK), `company_id` (FK), `is_active`, personal info, license info, vehicle info.
- **SHOPS**: `id` (PK), `name`, `is_active`, location info, contact info, license info.
- **COMPANIES**: `id` (PK), `name`, `is_active`, location info, contact info, company_type, license info.

### Junction & System Tables
- **COMPANIES_SHOPS**: `id` (PK), `company_id` (FK), `shop_id` (FK) [M:N Relationship].
- **ACTION_LOGS**: Audit trail (old_values, new_values, action_name, user_id).
- **API_LOGS**: HTTP request logging (endpoint, body, query, user_id).

### Soft Delete
All core tables utilize soft deletion via the `deleted_at` column.