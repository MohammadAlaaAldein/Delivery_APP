import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../orders.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus, PaymentMethod, OrderItemType, OrderItem } from '../order.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { CommonModule } from '@angular/common';
import { ShopsService } from '../../shops/shops.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-shop-order-form',
    standalone: true,
    imports: [ReactiveFormsModule, FormsModule, TranslateModule, FormBuilderComponent, CommonModule],
    templateUrl: './shop-order-form.component.html',
})
export class ShopOrderFormComponent {

    order: Order | null = null;
    orderId: number | null = null;
    isCreateMode: boolean = false;
    isViewMode: boolean = false;

    cityOptions: { value: string, label: string }[] = [];
    companyOptions: { value: number, label: string }[] = [];
    paymentMethodOptions = [
        { value: PaymentMethod.CASH, label: 'Cash' },
        { value: PaymentMethod.CARD, label: 'Card' },
        { value: PaymentMethod.ONLINE, label: 'Online' },
    ];
    pickupTypeOptions = [
        { value: 'now', label: 'Pickup Now' },
        { value: 'scheduled', label: 'Scheduled Pickup' },
    ];
    itemTypeOptions = [
        { value: OrderItemType.BAG, label: 'Bag' },
        { value: OrderItemType.ENVELOPE, label: 'Envelope' },
        { value: OrderItemType.SMALL_BOX, label: 'Small Box' },
        { value: OrderItemType.MEDIUM_BOX, label: 'Medium Box' },
        { value: OrderItemType.LARGE_BOX, label: 'Large Box' },
        { value: OrderItemType.CUSTOM, label: 'Custom' },
    ];
    pickupType: string = 'now';

    fields: any = {
        // Customer Info
        customer_name: { type: "text", is_required: true, section: 'customer_info' },
        customer_phone: { type: "text", is_required: true, section: 'customer_info' },
        customer_phone_alt: { type: "text", section: 'customer_info' },
        customer_email: { type: "email", section: 'customer_info' },
        // Delivery Address
        delivery_city: { type: "select", options: [], section: 'delivery_address' },
        delivery_area: { type: "text", section: 'delivery_address' },
        delivery_street: { type: "text", section: 'delivery_address' },
        delivery_building: { type: "text", section: 'delivery_address' },
        delivery_address: { type: "textarea", section: 'delivery_address' },
        delivery_notes: { type: "textarea", section: 'delivery_address' },
        // Order Details - simplified
        order_amount: { type: "number", section: 'order_details' },
        delivery_fee: { type: "number", section: 'order_details' },
        requires_large_vehicle: { type: "checkbox", section: 'order_details' },
        // Payment
        payment_method: { type: "select", options: [], section: 'payment' },
        // Priority
        priority: { type: "number", section: 'scheduling' },
        // Company selection (optional)
        company_id: { type: "select", options: [], section: 'assignment' },
        // Notes
        shop_notes: { type: "textarea", section: 'notes' },
    }
    formFieldsList = [];

    orderForm!: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private ordersService: OrdersService,
        private shopsService: ShopsService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initOptions();
        this.isCreateMode = this.route.snapshot.url.some(segment => segment.path === 'create');
        this.isViewMode = this.route.snapshot.url.some(segment => segment.path === 'view');

        this.orderForm = this._formBuilder.group({
            customer_name: ['', [Validators.required, Validators.minLength(2)]],
            customer_phone: ['', [Validators.required]],
            customer_phone_alt: [''],
            customer_email: [''],
            delivery_city: [''],
            delivery_area: [''],
            delivery_street: [''],
            delivery_building: [''],
            delivery_address: [''],
            delivery_notes: [''],
            order_items: this._formBuilder.array([]),
            requires_large_vehicle: [false],
            order_amount: [null],
            delivery_fee: [null],
            payment_method: [PaymentMethod.CASH],
            scheduled_pickup_time: [''],
            priority: [0],
            company_id: [null],
            shop_notes: [''],
        });

        // Add one empty item by default
        this.addOrderItem();

        this.formFieldsList = Object.keys(this.fields);

        if (!this.isCreateMode) {
            this.loadOrderData();
        }

        this.loadConnectedCompanies();
    }

    initOptions() {
        this.cityOptions = this.commonService.getCityOptions();

        this.paymentMethodOptions = this.paymentMethodOptions.map(opt => ({
            ...opt,
            label: this.translate.instant(`orders.payment_methods.${opt.value}`)
        }));

        this.pickupTypeOptions = [
            { value: 'now', label: this.translate.instant('orders.pickup_now') },
            { value: 'scheduled', label: this.translate.instant('orders.pickup_scheduled') },
        ];

        this.itemTypeOptions = [
            { value: OrderItemType.BAG, label: this.translate.instant('orders.item_types.bag') },
            { value: OrderItemType.ENVELOPE, label: this.translate.instant('orders.item_types.envelope') },
            { value: OrderItemType.SMALL_BOX, label: this.translate.instant('orders.item_types.small_box') },
            { value: OrderItemType.MEDIUM_BOX, label: this.translate.instant('orders.item_types.medium_box') },
            { value: OrderItemType.LARGE_BOX, label: this.translate.instant('orders.item_types.large_box') },
            { value: OrderItemType.CUSTOM, label: this.translate.instant('orders.item_types.custom') },
        ];

        this.fields = {
            ...this.fields,
            delivery_city: { ...this.fields.delivery_city, options: this.cityOptions },
            payment_method: { ...this.fields.payment_method, options: this.paymentMethodOptions },
        };
    }

    onPickupTypeChange() {
        if (this.pickupType === 'now') {
            this.orderForm.patchValue({ scheduled_pickup_time: '' });
        }
    }

    loadConnectedCompanies() {
        // Load companies connected to this shop for optional selection
        this.shopsService.getMyShop().subscribe({
            next: (res) => {
                const shop = res.data;
                const companyIds = shop.company_ids || [];
                const companyNames = shop.company_names || [];

                this.companyOptions = [
                    { value: null as any, label: this.translate.instant('orders.any_company') },
                    ...companyIds.map((id, index) => ({ value: id, label: companyNames[index] || `Company ${id}` }))
                ];
                this.fields = {
                    ...this.fields,
                    company_id: { ...this.fields.company_id, options: this.companyOptions }
                };
            },
            error: () => {
                // If error, just show empty option
                this.companyOptions = [
                    { value: null as any, label: this.translate.instant('orders.any_company') }
                ];
            }
        });
    }

    loadOrderData() {
        this.orderId = +this.route.snapshot.paramMap.get('id');

        if (this.orderId) {
            this.ordersService.getShopOrder(this.orderId).subscribe((res) => {
                this.order = res.data;
                this.orderForm.patchValue({
                    customer_name: this.order.customer_name,
                    customer_phone: this.order.customer_phone,
                    customer_phone_alt: this.order.customer_phone_alt || '',
                    customer_email: this.order.customer_email || '',
                    delivery_city: this.order.delivery_city || '',
                    delivery_area: this.order.delivery_area || '',
                    delivery_street: this.order.delivery_street || '',
                    delivery_building: this.order.delivery_building || '',
                    delivery_address: this.order.delivery_address || '',
                    delivery_notes: this.order.delivery_notes || '',
                    requires_large_vehicle: this.order.requires_large_vehicle || false,
                    order_amount: this.order.order_amount || 0,
                    delivery_fee: this.order.delivery_fee || 0,
                    payment_method: this.order.payment_method || PaymentMethod.CASH,
                    scheduled_pickup_time: this.formatDateTimeForInput(this.order.scheduled_pickup_time),
                    priority: this.order.priority || 0,
                    company_id: this.order.company_id || null,
                    shop_notes: this.order.shop_notes || '',
                });

                // Load order items
                this.loadOrderItems(this.order.order_items || []);

                // Set pickup type based on existing data
                this.pickupType = this.order.scheduled_pickup_time ? 'scheduled' : 'now';

                this.orderForm.markAsPristine();
            });
        }
    }

    formatDateTimeForInput(dateStr: string | null | undefined): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    }

    onSubmit() {
        if (this.orderForm.valid) {
            // Validate scheduled pickup if scheduled type
            if (this.pickupType === 'scheduled' && !this.orderForm.value.scheduled_pickup_time) {
                Swal.fire({
                    title: this.translate.instant('g.invalid_fields'),
                    text: this.translate.instant('orders.scheduled_pickup_required'),
                    icon: 'warning'
                });
                return;
            }

            const data = { ...this.orderForm.value };

            // Clean up empty/null optional fields
            if (!data.company_id) {
                delete data.company_id;
            }
            if (!data.customer_email || data.customer_email.trim() === '') {
                delete data.customer_email;
            }
            if (data.order_amount === null || data.order_amount === '' || data.order_amount === undefined) {
                delete data.order_amount;
            }
            if (data.delivery_fee === null || data.delivery_fee === '' || data.delivery_fee === undefined) {
                delete data.delivery_fee;
            }
            if (!data.customer_phone_alt || data.customer_phone_alt.trim() === '') {
                delete data.customer_phone_alt;
            }
            if (!data.delivery_city) {
                delete data.delivery_city;
            }
            if (!data.delivery_area || data.delivery_area.trim() === '') {
                delete data.delivery_area;
            }
            if (!data.delivery_street || data.delivery_street.trim() === '') {
                delete data.delivery_street;
            }
            if (!data.delivery_building || data.delivery_building.trim() === '') {
                delete data.delivery_building;
            }
            if (!data.delivery_address || data.delivery_address.trim() === '') {
                delete data.delivery_address;
            }
            if (!data.delivery_notes || data.delivery_notes.trim() === '') {
                delete data.delivery_notes;
            }
            if (!data.shop_notes || data.shop_notes.trim() === '') {
                delete data.shop_notes;
            }

            // Clear scheduled time if pickup now
            if (this.pickupType === 'now') {
                delete data.scheduled_pickup_time;
            }

            if (this.isCreateMode) {
                this.ordersService.createOrder(data).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_created_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.router.navigate(['/my-orders']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || '',
                            icon: 'error'
                        });
                    }
                });
            } else if (this.orderId) {
                this.ordersService.updateShopOrder(this.orderId, data).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_updated_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.router.navigate(['/my-orders']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || '',
                            icon: 'error'
                        });
                    }
                });
            }
        } else {
            this.orderForm.markAllAsTouched();
        }
    }

    cancelOrder() {
        Swal.fire({
            title: this.translate.instant('orders.cancel_order'),
            input: 'textarea',
            inputLabel: this.translate.instant('orders.cancellation_reason'),
            inputPlaceholder: this.translate.instant('orders.enter_cancellation_reason'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel'),
            inputValidator: (value) => {
                if (!value) {
                    return this.translate.instant('orders.cancellation_reason_required');
                }
                return null;
            }
        }).then(result => {
            if (result.isConfirmed) {
                this.ordersService.cancelShopOrder(this.orderId, result.value).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_cancelled_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.router.navigate(['/my-orders']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || '',
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/my-orders']);
    }

    canEdit(): boolean {
        if (this.isCreateMode) return true;
        if (this.isViewMode) return false;
        return this.order?.status === OrderStatus.PENDING || this.order?.status === OrderStatus.ASSIGNED_TO_COMPANY;
    }

    canCancel(): boolean {
        if (!this.order) return false;
        return ![OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(this.order.status);
    }

    getStatusClass(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.PENDING: return 'badge bg-warning';
            case OrderStatus.ASSIGNED_TO_COMPANY: return 'badge bg-info';
            case OrderStatus.ASSIGNED_TO_DRIVER: return 'badge bg-primary';
            case OrderStatus.PICKED_UP: return 'badge bg-secondary';
            case OrderStatus.IN_TRANSIT: return 'badge bg-info';
            case OrderStatus.DELIVERED: return 'badge bg-success';
            case OrderStatus.CANCELLED: return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    // Order Items Management
    get orderItems(): FormArray {
        return this.orderForm.get('order_items') as FormArray;
    }

    addOrderItem() {
        const itemForm = this._formBuilder.group({
            type: [OrderItemType.BAG],
            count: [1, [Validators.required, Validators.min(1)]],
            size: [''],
            description: [''],
        });
        this.orderItems.push(itemForm);
    }

    removeOrderItem(index: number) {
        if (this.orderItems.length > 1) {
            this.orderItems.removeAt(index);
        }
    }

    loadOrderItems(items: OrderItem[]) {
        // Clear existing items
        while (this.orderItems.length > 0) {
            this.orderItems.removeAt(0);
        }

        // Add items from order
        if (items && items.length > 0) {
            items.forEach(item => {
                const itemForm = this._formBuilder.group({
                    type: [item.type || OrderItemType.BAG],
                    count: [item.count || 1, [Validators.required, Validators.min(1)]],
                    size: [item.size || ''],
                    description: [item.description || ''],
                });
                this.orderItems.push(itemForm);
            });
        } else {
            // Add default empty item
            this.addOrderItem();
        }
    }

    getTotalItemsCount(): number {
        return this.orderItems.controls.reduce((total, item) => {
            return total + (item.get('count')?.value || 0);
        }, 0);
    }
}
