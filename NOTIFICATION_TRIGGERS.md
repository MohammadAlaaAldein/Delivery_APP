# 🔔 When Push Notifications Are Sent - Complete List

## ⚠️ **CURRENT STATUS: NOT YET INTEGRATED**

Push notifications are **set up and working**, but they are **NOT automatically triggered** by order status changes yet. You need to add the notification calls to your order service.

---

## 📋 Order Lifecycle & Notification Points

### 1️⃣ **ORDER_CREATED** - New Order Created
**When:** Shop creates a new order

**Current Code Location:** `orders.service.ts` line 51-89
```typescript
async createOrder(shopId: number, createOrderDto: CreateOrderDto): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Connected delivery companies (if order is PENDING)
- ✅ Assigned company (if company_id specified)

**What To Add:**
```typescript
// After line 86 (after emitOrderCreated)
// Notify company about new order
if (createOrderDto.company_id) {
    // Get company owner/admins user IDs
    const companyUserIds = await this.getCompanyAdminIds(createOrderDto.company_id);
    await this.pushNotificationsService.sendOrderNotification(
        savedOrder.id,
        NotificationType.ORDER_CREATED,
        companyUserIds,
        undefined,
        `Order #${savedOrder.order_number} has been created`
    );
}
```

---

### 2️⃣ **ORDER_ASSIGNED** - Order Assigned to Company
**When:** Company accepts/takes a pending order

**Current Code Location:** `orders.service.ts` line 212-241
```typescript
async assignToCompany(companyId: number, orderId: number, takeOrderDto: TakeOrderDto): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Shop owner (who created the order)

**What To Add:**
```typescript
// After line 238 (after emitOrderAssigned)
// Notify shop about company assignment
const shopUserIds = await this.getShopOwnerIds(order.shop_id);
await this.pushNotificationsService.sendOrderNotification(
    order.id,
    NotificationType.ORDER_ASSIGNED,
    shopUserIds,
    'Order Accepted',
    `Your order #${order.order_number} has been accepted by a delivery company`
);
```

---

### 3️⃣ **DRIVER_ASSIGNED** - Driver Assigned to Order
**When:** Company assigns a driver to the order

**Current Code Location:** `orders.service.ts` line 274-312
```typescript
async assignDriver(companyId: number, orderId: number, assignDriverDto: AssignDriverDto): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Shop owner
- ✅ Assigned driver

**What To Add:**
```typescript
// After line 309 (after emitDriverAssigned)
// Notify shop about driver assignment
const shopUserIds = await this.getShopOwnerIds(savedOrder.shop_id);
await this.pushNotificationsService.sendOrderNotification(
    savedOrder.id,
    NotificationType.DRIVER_ASSIGNED,
    shopUserIds,
    'Driver Assigned',
    `A driver has been assigned to order #${savedOrder.order_number}`
);

// Notify driver about new assignment
await this.pushNotificationsService.sendOrderNotification(
    savedOrder.id,
    NotificationType.DRIVER_ASSIGNED,
    [assignDriverDto.driver_id.toString()],
    'New Order Assigned',
    `You have been assigned order #${savedOrder.order_number}`
);
```

---

### 4️⃣ **ORDER_PICKED_UP** - Driver Picked Up Order
**When:** Driver marks order as picked up from shop

**Current Code Location:** `orders.service.ts` line 393-414
```typescript
async pickupOrder(driverId: number, orderId: number, notes?: string): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Shop owner
- ✅ Company admins

**What To Add:**
```typescript
// After line 411 (after emitOrderPickedUp)
// Notify shop about pickup
const shopUserIds = await this.getShopOwnerIds(savedOrder.shop_id);
await this.pushNotificationsService.sendOrderNotification(
    savedOrder.id,
    NotificationType.ORDER_PICKED_UP,
    shopUserIds,
    'Order Picked Up',
    `Order #${savedOrder.order_number} has been picked up by the driver`
);

// Notify company
if (savedOrder.company_id) {
    const companyUserIds = await this.getCompanyAdminIds(savedOrder.company_id);
    await this.pushNotificationsService.sendOrderNotification(
        savedOrder.id,
        NotificationType.ORDER_PICKED_UP,
        companyUserIds
    );
}
```

---

### 5️⃣ **ORDER_IN_TRANSIT** - Order In Transit
**When:** Driver starts delivery (on the way)

**Current Code Location:** `orders.service.ts` line 416-435
```typescript
async startDelivery(driverId: number, orderId: number, notes?: string): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Shop owner
- ✅ Customer (if customer has app - future feature)

**What To Add:**
```typescript
// After line 432 (after emitOrderInTransit)
// Notify shop that delivery started
const shopUserIds = await this.getShopOwnerIds(savedOrder.shop_id);
await this.pushNotificationsService.sendOrderNotification(
    savedOrder.id,
    NotificationType.ORDER_IN_TRANSIT,
    shopUserIds,
    'Order In Transit',
    `Order #${savedOrder.order_number} is now on its way to the customer`
);

// Future: Notify customer via SMS or if they have app
```

---

### 6️⃣ **ORDER_DELIVERED** ✅ - Order Delivered Successfully
**When:** Driver marks order as delivered

**Current Code Location:** `orders.service.ts` line 437-462
```typescript
async deliverOrder(driverId: number, orderId: number, notes?: string): Promise<OrderHistory>
```

**Who Should Be Notified:**
- ✅ Shop owner
- ✅ Company admins
- ✅ Customer (future)

**What To Add:**
```typescript
// Before line 456 (before moveOrderToHistory)
// Notify shop about delivery
const shopUserIds = await this.getShopOwnerIds(order.shop_id);
await this.pushNotificationsService.sendOrderNotification(
    order.id,
    NotificationType.ORDER_DELIVERED,
    shopUserIds,
    'Order Delivered',
    `Order #${order.order_number} has been successfully delivered`
);

// Notify company
if (order.company_id) {
    const companyUserIds = await this.getCompanyAdminIds(order.company_id);
    await this.pushNotificationsService.sendOrderNotification(
        order.id,
        NotificationType.ORDER_DELIVERED,
        companyUserIds
    );
}

// Future: Notify customer
```

---

### 7️⃣ **ORDER_CANCELLED** - Order Cancelled
**When:** Shop cancels the order

**Current Code Location:** `orders.service.ts` line 143-166
```typescript
async cancelOrder(shopId: number, orderId: number, cancelOrderDto: CancelOrderDto): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Company (if assigned)
- ✅ Driver (if assigned)

**What To Add:**
```typescript
// After line 163 (after save)
// Notify company about cancellation
if (order.company_id) {
    const companyUserIds = await this.getCompanyAdminIds(order.company_id);
    await this.pushNotificationsService.sendOrderNotification(
        order.id,
        NotificationType.ORDER_CANCELLED,
        companyUserIds,
        'Order Cancelled',
        `Order #${order.order_number} has been cancelled. Reason: ${cancelOrderDto.reason}`
    );
}

// Notify driver if assigned
if (order.driver_id) {
    await this.pushNotificationsService.sendOrderNotification(
        order.id,
        NotificationType.ORDER_CANCELLED,
        [order.driver_id.toString()],
        'Order Cancelled',
        `Order #${order.order_number} has been cancelled`
    );
}
```

---

### 8️⃣ **ORDER_UPDATED** - Order Details Updated
**When:** Shop updates order details

**Current Code Location:** `orders.service.ts` line 130-141
```typescript
async updateOrder(shopId: number, orderId: number, updateOrderDto: UpdateOrderDto): Promise<Order>
```

**Who Should Be Notified:**
- ✅ Company (if assigned)
- ✅ Driver (if assigned and important fields changed)

**What To Add:**
```typescript
// After saving (after line 138)
// Notify if order is already assigned
if (order.company_id) {
    const companyUserIds = await this.getCompanyAdminIds(order.company_id);
    await this.pushNotificationsService.sendOrderNotification(
        order.id,
        NotificationType.ORDER_UPDATED,
        companyUserIds,
        'Order Updated',
        `Order #${order.order_number} details have been updated`
    );
}

// Notify driver if delivery details changed
if (order.driver_id && (updateOrderDto.customer_address || updateOrderDto.customer_phone)) {
    await this.pushNotificationsService.sendOrderNotification(
        order.id,
        NotificationType.ORDER_UPDATED,
        [order.driver_id.toString()],
        'Order Details Updated',
        `Order #${order.order_number} delivery information has been updated`
    );
}
```

---

### 9️⃣ **NEW_ORDER_AVAILABLE** - New Order Available for Companies
**When:** Shop creates a PENDING order (not assigned to specific company)

**Current Code Location:** `orders.service.ts` line 51-89 (same as ORDER_CREATED)

**Who Should Be Notified:**
- ✅ All companies connected to the shop

**What To Add:**
```typescript
// After line 86 (if order is PENDING)
if (!createOrderDto.company_id) {
    // Notify all connected companies
    const companyUserIds = await this.getAllConnectedCompanyAdminIds(shopId);
    if (companyUserIds.length > 0) {
        await this.pushNotificationsService.sendOrderNotification(
            savedOrder.id,
            NotificationType.NEW_ORDER_AVAILABLE,
            companyUserIds,
            'New Order Available',
            `New order #${savedOrder.order_number} is available for pickup`
        );
    }
}
```

---

## 🔧 Helper Methods You Need to Add

Add these helper methods to `orders.service.ts`:

```typescript
// Get shop owner user IDs
private async getShopOwnerIds(shopId: number): Promise<string[]> {
    const shop = await this.shopsRepository.findOne({
        where: { id: shopId },
        relations: ['user']
    });
    return shop?.user?.id ? [shop.user.id.toString()] : [];
}

// Get company admin user IDs
private async getCompanyAdminIds(companyId: number): Promise<string[]> {
    const company = await this.companiesRepository.findOne({
        where: { id: companyId },
        relations: ['user']
    });
    return company?.user?.id ? [company.user.id.toString()] : [];
}

// Get all connected company admin IDs for a shop
private async getAllConnectedCompanyAdminIds(shopId: number): Promise<string[]> {
    const companyIds = await this.companiesShopsService.getCompanyIdsByShopId(shopId);
    const userIds: string[] = [];
    
    for (const companyId of companyIds) {
        const ids = await this.getCompanyAdminIds(companyId);
        userIds.push(...ids);
    }
    
    return userIds;
}
```

---

## 📦 Required Dependencies

Make sure to inject `PushNotificationsService` in `orders.service.ts`:

```typescript
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { NotificationType } from '../push-notifications/dto/push-notification.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderHistory)
        private ordersHistoryRepository: Repository<OrderHistory>,
        private companiesShopsService: CompaniesShopsService,
        private driversService: DriversService,
        private ordersGateway: OrdersGateway,
        private pushNotificationsService: PushNotificationsService, // ← Add this
    ) { }
```

Also update `orders.module.ts`:

```typescript
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderHistory]),
        forwardRef(() => CompaniesShopsModule),
        forwardRef(() => DriversModule),
        PushNotificationsModule, // ← Add this
    ],
    // ... rest of module
})
```

---

## 📊 Notification Summary Table

| Event | Triggered When | Notify Who | Priority |
|-------|---------------|------------|----------|
| **ORDER_CREATED** | Shop creates order | Company admins | High |
| **NEW_ORDER_AVAILABLE** | Shop creates PENDING order | All connected companies | High |
| **ORDER_ASSIGNED** | Company takes order | Shop owner | Medium |
| **DRIVER_ASSIGNED** | Company assigns driver | Shop + Driver | High |
| **ORDER_PICKED_UP** | Driver picks up from shop | Shop + Company | High |
| **ORDER_IN_TRANSIT** | Driver starts delivery | Shop (+ Customer) | Medium |
| **ORDER_DELIVERED** | Driver completes delivery | Shop + Company | High |
| **ORDER_CANCELLED** | Shop cancels order | Company + Driver | High |
| **ORDER_UPDATED** | Shop updates details | Company + Driver | Low |
| **DRIVER_UNASSIGNED** | Company removes driver | Driver | Medium |

---

## 🚀 Implementation Steps

### Step 1: Add PushNotificationsService to OrdersModule
```typescript
// backend/src/modules/orders/orders.module.ts
imports: [
    // ... existing imports
    PushNotificationsModule,
]
```

### Step 2: Inject Service in OrdersService
```typescript
// backend/src/modules/orders/orders.service.ts
constructor(
    // ... existing dependencies
    private pushNotificationsService: PushNotificationsService,
) { }
```

### Step 3: Add Helper Methods
Copy the 3 helper methods above to get user IDs.

### Step 4: Add Notification Calls
Go through each method in the list above and add the notification calls after the appropriate events.

### Step 5: Test
1. Create an order → Check notification sent to company
2. Assign driver → Check notification sent to shop & driver
3. Pick up order → Check notification sent to shop
4. Deliver order → Check notification sent to shop & company

---

## 🎯 Quick Implementation Example

Here's a complete example for **ORDER_DELIVERED**:

```typescript
// In orders.service.ts - deliverOrder method
async deliverOrder(driverId: number, orderId: number, notes?: string): Promise<OrderHistory> {
    const order = await this.getDriverOrder(driverId, orderId);

    if (![OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
        throw new BadRequestException('Order must be picked up or in transit');
    }

    order.status = OrderStatus.DELIVERED;
    order.delivered_at = new Date();
    if (notes) {
        order.driver_notes = notes;
    }

    await this.driversService.clearLocation(driverId);

    // 🔔 SEND NOTIFICATIONS
    try {
        // Notify shop
        const shopUserIds = await this.getShopOwnerIds(order.shop_id);
        if (shopUserIds.length > 0) {
            await this.pushNotificationsService.sendOrderNotification(
                order.id,
                NotificationType.ORDER_DELIVERED,
                shopUserIds,
                '✅ Order Delivered',
                `Order #${order.order_number} has been successfully delivered to the customer`
            );
        }

        // Notify company
        if (order.company_id) {
            const companyUserIds = await this.getCompanyAdminIds(order.company_id);
            if (companyUserIds.length > 0) {
                await this.pushNotificationsService.sendOrderNotification(
                    order.id,
                    NotificationType.ORDER_DELIVERED,
                    companyUserIds
                );
            }
        }
    } catch (error) {
        this.logger.error(`Failed to send delivery notifications: ${error.message}`);
        // Don't fail the delivery if notification fails
    }

    // Emit WebSocket event
    this.ordersGateway.emitOrderDelivered(order);

    // Move to history
    const historyRecord = await this.moveOrderToHistory(order);
    await this.ordersRepository.remove(order);

    return historyRecord;
}
```

---

## ✅ Testing Checklist

- [ ] Order created → Company receives notification
- [ ] Order assigned → Shop receives notification
- [ ] Driver assigned → Shop and driver receive notifications
- [ ] Order picked up → Shop receives notification
- [ ] Order in transit → Shop receives notification
- [ ] Order delivered → Shop and company receive notifications
- [ ] Order cancelled → Company and driver receive notifications
- [ ] Order updated → Company/driver receive notification
- [ ] Notifications show in bell icon dropdown
- [ ] Notification badge count updates
- [ ] Clicking notification navigates to order details

---

## 📝 Notes

- All notification sends are wrapped in try-catch to not block order operations
- User IDs are converted to strings (required by notification service)
- Notifications are logged in `notification_logs` table
- Failed notifications are tracked for debugging
- Service uses Firebase Admin SDK to send to all platforms (Web, iOS, Android)

---

**Ready to implement?** Start with the most important ones (DELIVERED, PICKED_UP, ASSIGNED) first!
