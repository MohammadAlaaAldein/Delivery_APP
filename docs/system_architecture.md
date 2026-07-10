# 📦 Delivery App - System Architecture

## 🏢 Business Overview
The Delivery App coordinates operations between Shops (merchants), Companies (delivery service providers), and Drivers (delivery personnel).

### User Roles
- `admin`: Full system access.
- `shop`: Access to "My Shop" dashboard.
- `company`: Access to "My Company" & "My Drivers" dashboards.
- `driver`: Access to "My Profile" dashboard.

### Business Relationships
1. Shops ↔ Companies: Many-to-Many via `companies_shops`.
2. Companies → Drivers: One-to-Many (via `company_id`).
3. Users → Drivers: One-to-One (driver profile extends user record).

## 🛠️ Tech Stack & Structure
- **Backend**: NestJS 10.x, TypeORM 0.3.x, PostgreSQL, Redis, Fastify, JWT.
- **Frontend**: Angular 18.x, Bootstrap 5.x.
- **Mobile**: Expo SDK 54 (React Native), Zustand, Axios, Socket.IO Client.
- **Supported Cities**: Amman, Irbid, Zarqa, Balqa, Mafraq, Jerash, Ajloun, Madaba, Karak, Tafilah, Ma'an, Aqaba.