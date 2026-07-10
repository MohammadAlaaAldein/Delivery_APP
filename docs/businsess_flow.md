# 🔄 Key Business Logic & Request Workflows

### Approval Workflows
- **SHOPS_REQUESTS** & **DRIVERS_REQUESTS**: Statuses (`pending`, `approved`, `rejected`).
- **Company Action**: Create/Edit/Resubmit pending or rejected requests.
- **Admin Action**: Approve or Reject (with `admin_notes`).
- **Post-Approval**: Admin approval automatically creates the real entity (Shop or User+Driver with a temp password) and DELETES the request record.

### Logic Rules
- **Driver Creation**: If `user.role === 'driver'`, automatically manage the associated `DRIVERS` record.
- **Active Filtering**: Dropdowns must only filter and display active entities (`is_active: true`).