import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../orders.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../order.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-order-form',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent, CommonModule],
    templateUrl: './admin-order-form.component.html',
})
export class AdminOrderFormComponent {

    order: Order | null = null;
    orderId: number | null = null;
    isViewMode: boolean = false;

    cityOptions: { value: string, label: string }[] = [];
    paymentMethodOptions = [
        { value: PaymentMethod.CASH, label: 'Cash' },
        { value: PaymentMethod.CARD, label: 'Card' },
        { value: PaymentMethod.ONLINE, label: 'Online' },
    ];
    paymentStatusOptions = [
        { value: PaymentStatus.PENDING, label: 'Pending' },
        { value: PaymentStatus.PAID, label: 'Paid' },
        { value: PaymentStatus.FAILED, label: 'Failed' },
        { value: PaymentStatus.REFUNDED, label: 'Refunded' },
    ];
    statusOptions = [
        { value: OrderStatus.PENDING, label: 'Pending' },
        { value: OrderStatus.ASSIGNED_TO_COMPANY, label: 'Assigned to Company' },
        { value: OrderStatus.ASSIGNED_TO_DRIVER, label: 'Assigned to Driver' },
        { value: OrderStatus.PICKED_UP, label: 'Picked Up' },
        { value: OrderStatus.IN_TRANSIT, label: 'In Transit' },
        { value: OrderStatus.DELIVERED, label: 'Delivered' },
        { value: OrderStatus.CANCELLED, label: 'Cancelled' },
    ];

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
        // Order Details
        order_description: { type: "textarea", section: 'order_details' },
        items_count: { type: "number", section: 'order_details' },
        order_amount: { type: "number", section: 'order_details' },
        delivery_fee: { type: "number", section: 'order_details' },
        // Payment
        payment_method: { type: "select", options: [], section: 'payment' },
        payment_status: { type: "select", options: [], section: 'payment' },
        is_paid: { type: "checkbox", section: 'payment' },
        // Status
        status: { type: "select", options: [], section: 'status' },
        // Scheduling
        scheduled_pickup_time: { type: "datetime-local", section: 'scheduling' },
        scheduled_delivery_time: { type: "datetime-local", section: 'scheduling' },
        priority: { type: "number", section: 'scheduling' },
        // Notes
        shop_notes: { type: "textarea", section: 'notes' },
        company_notes: { type: "textarea", section: 'notes' },
        driver_notes: { type: "textarea", section: 'notes' },
    }
    formFieldsList = [];

    orderForm!: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private ordersService: OrdersService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initOptions();
        this.isViewMode = this.route.snapshot.url.some(segment => segment.path === 'view');

        this.orderForm = this._formBuilder.group({
            customer_name: ['', [Validators.required, Validators.minLength(2)]],
            customer_phone: ['', [Validators.required]],
            customer_phone_alt: [''],
            customer_email: ['', [Validators.email]],
            delivery_city: [''],
            delivery_area: [''],
            delivery_street: [''],
            delivery_building: [''],
            delivery_address: [''],
            delivery_notes: [''],
            order_description: [''],
            items_count: [1, [Validators.min(1)]],
            order_amount: [0, [Validators.min(0)]],
            delivery_fee: [0, [Validators.min(0)]],
            payment_method: [PaymentMethod.CASH],
            payment_status: [PaymentStatus.PENDING],
            is_paid: [false],
            status: [OrderStatus.PENDING],
            scheduled_pickup_time: [''],
            scheduled_delivery_time: [''],
            priority: [0],
            shop_notes: [''],
            company_notes: [''],
            driver_notes: [''],
        });

        this.formFieldsList = Object.keys(this.fields);
        this.loadOrderData();
    }

    initOptions() {
        this.cityOptions = this.commonService.getCityOptions();

        this.paymentMethodOptions = this.paymentMethodOptions.map(opt => ({
            ...opt,
            label: this.translate.instant(`orders.payment_methods.${opt.value}`)
        }));

        this.paymentStatusOptions = this.paymentStatusOptions.map(opt => ({
            ...opt,
            label: this.translate.instant(`orders.payment_status.${opt.value}`)
        }));

        this.statusOptions = this.statusOptions.map(opt => ({
            ...opt,
            label: this.translate.instant(`orders.status.${opt.value}`)
        }));

        this.fields = {
            ...this.fields,
            delivery_city: { ...this.fields.delivery_city, options: this.cityOptions },
            payment_method: { ...this.fields.payment_method, options: this.paymentMethodOptions },
            payment_status: { ...this.fields.payment_status, options: this.paymentStatusOptions },
            status: { ...this.fields.status, options: this.statusOptions },
        };
    }

    loadOrderData() {
        this.orderId = +this.route.snapshot.paramMap.get('id');

        if (this.orderId) {
            this.ordersService.getOrder(this.orderId).subscribe((res) => {
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
                    order_description: this.order.order_description || '',
                    items_count: this.order.items_count || 1,
                    order_amount: this.order.order_amount || 0,
                    delivery_fee: this.order.delivery_fee || 0,
                    payment_method: this.order.payment_method || PaymentMethod.CASH,
                    payment_status: this.order.payment_status || PaymentStatus.PENDING,
                    is_paid: this.order.is_paid || false,
                    status: this.order.status,
                    scheduled_pickup_time: this.formatDateTimeForInput(this.order.scheduled_pickup_time),
                    scheduled_delivery_time: this.formatDateTimeForInput(this.order.scheduled_delivery_time),
                    priority: this.order.priority || 0,
                    shop_notes: this.order.shop_notes || '',
                    company_notes: this.order.company_notes || '',
                    driver_notes: this.order.driver_notes || '',
                });

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
        if (this.orderForm.valid && this.orderId) {
            this.ordersService.adminUpdateOrder(this.orderId, this.orderForm.value).subscribe({
                next: () => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/orders']);
                },
                error: (err) => {
                    this.notificationMessageService.setMessage(err.error?.message || 'g.something_went_wrong', { clearOnXTimeNavigate: 1 });
                }
            });
        } else {
            this.orderForm.markAllAsTouched();
        }
    }

    deleteOrder() {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_delete'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.deleteOrder(this.orderId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_deleted_successfully'),
                            icon: 'success',
                            timer: 2000
                        });
                        this.router.navigate(['/orders']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || this.translate.instant('g.something_went_wrong'),
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/orders']);
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
}
