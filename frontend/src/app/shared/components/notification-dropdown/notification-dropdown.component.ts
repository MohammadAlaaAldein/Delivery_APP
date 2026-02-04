import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PushNotificationService, PushNotification } from '../../services/push-notification.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  template: `
    <div ngbDropdown class="notification-dropdown" placement="bottom-start" container="body">
      <button 
        ngbDropdownToggle 
        class="btn notification-btn"
        [class.has-unread]="unreadCount > 0"
      >
        <i class="feather icon-bell"></i>
        <span *ngIf="unreadCount > 0" class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      
      <div ngbDropdownMenu class="notification-menu">
        <div class="notification-header">
          <h6>الإشعارات</h6>
          <div class="header-actions">
            <button 
              *ngIf="permissionStatus !== 'granted'" 
              class="btn btn-sm btn-primary me-2"
              (click)="enableNotifications()"
            >
              تفعيل
            </button>
            <button 
              *ngIf="notifications.length > 0"
              class="btn btn-sm btn-link"
              (click)="markAllAsRead()"
            >
              تحديد الكل كمقروء
            </button>
          </div>
        </div>
        
        <div class="notification-body">
          <div *ngIf="!isSupported" class="notification-item text-center text-muted py-3">
            <i class="feather icon-alert-circle mb-2"></i>
            <p class="mb-0">الإشعارات غير مدعومة في هذا المتصفح.</p>
          </div>
          
          <div *ngIf="isSupported && permissionStatus === 'denied'" class="notification-item text-center text-muted py-3">
            <i class="feather icon-bell-off mb-2"></i>
            <p class="mb-0">الإشعارات محظورة. الرجاء تفعيلها من إعدادات المتصفح.</p>
          </div>
          
          <div *ngIf="isSupported && permissionStatus !== 'denied' && notifications.length === 0" class="notification-item text-center text-muted py-3">
            <i class="feather icon-inbox mb-2"></i>
            <p class="mb-0">لا توجد إشعارات حتى الآن</p>
          </div>
          
          <div 
            *ngFor="let notification of notifications; let i = index"
            class="notification-item"
            [class.unread]="!notification.read"
            (click)="onNotificationClick(notification, i)"
          >
            <div class="notification-icon">
              <i [class]="getNotificationIcon(notification)"></i>
            </div>
            <div class="notification-content">
              <h6 class="notification-title">{{ notification.title }}</h6>
              <p class="notification-text">{{ notification.body }}</p>
              <small class="notification-time">{{ formatTime(notification.timestamp) }}</small>
            </div>
          </div>
        </div>
        
        <div *ngIf="notifications.length > 0" class="notification-footer">
          <button class="btn btn-link btn-sm" (click)="clearAll()">
            مسح الكل
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-dropdown {
      position: relative;
    }
    
    .notification-btn {
      position: relative;
      background: transparent;
      border: none;
      color: #5b6b79;
      font-size: 20px;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s;
      
      &:hover {
        background: #f1f3f5;
        color: #4680ff;
      }
      
      &.has-unread {
        color: #4680ff;
      }
    }
    
    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #dc3545;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }
    
    .notification-menu {
      width: 360px;
      max-height: 480px;
      padding: 0;
      border: none;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
      
      h6 {
        margin: 0;
        font-weight: 600;
        color: #1c2d41;
      }
      
      .header-actions {
        display: flex;
        align-items: center;
      }
    }
    
    .notification-body {
      max-height: 360px;
      overflow-y: auto;
    }
    
    .notification-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f3f5;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: #f8f9fa;
      }
      
      &.unread {
        background: #f0f7ff;
        
        &:hover {
          background: #e6f2ff;
        }
        
        .notification-title {
          font-weight: 600;
        }
      }
    }
    
    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      
      i {
        font-size: 18px;
        color: #4680ff;
      }
    }
    
    .notification-content {
      flex: 1;
      min-width: 0;
    }
    
    .notification-title {
      margin: 0 0 4px;
      font-size: 14px;
      color: #1c2d41;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .notification-text {
      margin: 0 0 4px;
      font-size: 13px;
      color: #5b6b79;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .notification-time {
      font-size: 11px;
      color: #8996a4;
    }
    
    .notification-footer {
      padding: 12px 16px;
      text-align: center;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: PushNotification[] = [];
  unreadCount = 0;
  permissionStatus: NotificationPermission = 'default';
  isSupported = false;

  private destroy$ = new Subject<void>();

  constructor(
    private pushService: PushNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isSupported = this.pushService.isSupported();

    this.pushService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    this.pushService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    this.pushService.permissionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.permissionStatus = status;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async enableNotifications(): Promise<void> {
    await this.pushService.requestPermission();
  }

  onNotificationClick(notification: PushNotification, index: number): void {
    this.pushService.markAsRead(index);

    // Navigate based on notification type using Angular Router
    if (notification.data?.['type'] === 'order_update' && notification.data?.['orderId']) {
      const orderId = notification.data['orderId'];
      // Navigate to orders page with the order ID
      this.router.navigate(['/orders'], { queryParams: { id: orderId } });
    }
  }

  markAllAsRead(): void {
    this.pushService.markAllAsRead();
  }

  clearAll(): void {
    this.pushService.clearAll();
  }

  getNotificationIcon(notification: PushNotification): string {
    const type = notification.data?.['type'];

    switch (type) {
      case 'ORDER_CREATED':
      case 'order_update':
        return 'feather icon-shopping-bag';
      case 'ORDER_DELIVERED':
        return 'feather icon-check-circle';
      case 'ORDER_CANCELLED':
        return 'feather icon-x-circle';
      case 'DRIVER_ASSIGNED':
        return 'feather icon-user-check';
      default:
        return 'feather icon-bell';
    }
  }

  formatTime(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }
}
