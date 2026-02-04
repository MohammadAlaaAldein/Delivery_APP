import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Screen Dimensions
export const SCREEN = {
    width,
    height,
    isSmall: width < 375,
    isMedium: width >= 375 && width < 414,
    isLarge: width >= 414,
};

// Colors - Modern Professional Theme
export const COLORS = {
    // Primary Colors
    primary: '#3B82F6', // Blue
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    primarySoft: '#EFF6FF',

    // Secondary Colors
    secondary: '#8B5CF6', // Purple
    secondaryDark: '#7C3AED',
    secondaryLight: '#A78BFA',
    secondarySoft: '#F5F3FF',

    // Accent Colors
    accent: '#10B981', // Emerald
    accentDark: '#059669',
    accentLight: '#34D399',
    accentSoft: '#ECFDF5',

    // Status Colors
    success: '#22C55E',
    successDark: '#16A34A',
    successLight: '#4ADE80',
    successSoft: '#F0FDF4',

    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#FBBF24',
    warningSoft: '#FFFBEB',

    error: '#EF4444',
    errorDark: '#DC2626',
    errorLight: '#F87171',
    errorSoft: '#FEF2F2',

    info: '#3B82F6',
    infoDark: '#2563EB',
    infoLight: '#60A5FA',
    infoSoft: '#EFF6FF',

    // Grayscale
    black: '#000000',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray400: '#9CA3AF',
    gray300: '#D1D5DB',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB',
    white: '#FFFFFF',

    // Background Colors
    background: '#F9FAFB',
    backgroundDark: '#111827',
    surface: '#FFFFFF',
    surfaceDark: '#1F2937',

    // Text Colors
    text: '#111827',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Border Colors
    border: '#E5E7EB',
    borderDark: '#374151',
    divider: '#F3F4F6',

    // Order Status Colors
    orderPending: '#F59E0B',
    orderAssignedCompany: '#3B82F6',
    orderAssignedDriver: '#8B5CF6',
    orderPickedUp: '#06B6D4',
    orderInTransit: '#10B981',
    orderDelivered: '#22C55E',
    orderCancelled: '#EF4444',

    // Gradients (as arrays for LinearGradient)
    gradientPrimary: ['#3B82F6', '#2563EB'],
    gradientSecondary: ['#8B5CF6', '#7C3AED'],
    gradientSuccess: ['#22C55E', '#16A34A'],
    gradientWarning: ['#F59E0B', '#D97706'],
    gradientError: ['#EF4444', '#DC2626'],
    gradientDark: ['#1F2937', '#111827'],

    // Transparent
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// Typography
export const FONTS = {
    // Font Families
    regular: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
    }),
    medium: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
    }),
    semiBold: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
    }),
    bold: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
    }),
    light: Platform.select({
        ios: 'System',
        android: 'Roboto-Light',
        default: 'System',
    }),

    // Arabic Fonts
    arabicRegular: 'Cairo-Regular',
    arabicMedium: 'Cairo-Medium',
    arabicBold: 'Cairo-Bold',
};

// Font Sizes
export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
};

// Line Heights
export const LINE_HEIGHTS = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
};

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

// Border Radius
export const RADIUS = {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    base: 10,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
};

// Shadows
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    base: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    xl: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
    },
};

// Z-Index
export const Z_INDEX = {
    base: 1,
    dropdown: 10,
    sticky: 100,
    fixed: 200,
    modalBackdrop: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    toast: 700,
};

// Animation Durations
export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
};

// Icon Sizes
export const ICON_SIZES = {
    xs: 14,
    sm: 16,
    md: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
};

// Button Heights
export const BUTTON_HEIGHTS = {
    sm: 36,
    md: 44,
    lg: 52,
};

// Input Heights
export const INPUT_HEIGHTS = {
    sm: 40,
    md: 48,
    lg: 56,
};

// Card Styles
export const CARD_STYLE = {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.base,
};

// Container Padding
export const CONTAINER_PADDING = SPACING.base;

// API Configuration
export const API_CONFIG = {
    baseURL: __DEV__ ? 'http://192.168.100.4:1000' : 'https://api.yourdeliveryapp.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
};

// Socket Configuration
export const SOCKET_CONFIG = {
    url: __DEV__ ? 'http://192.168.100.4:1000' : 'https://api.yourdeliveryapp.com',
    options: {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    },
};

// Storage Keys
export const STORAGE_KEYS = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    user: 'user',
    language: 'language',
    theme: 'theme',
    pushToken: 'push_token',
    onboardingComplete: 'onboarding_complete',
};

// Notification Channels (Android)
export const NOTIFICATION_CHANNELS = {
    default: {
        id: 'default',
        name: 'Default',
        importance: 4, // HIGH
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
    },
    orders: {
        id: 'delivery_notifications',
        name: 'Order Notifications',
        importance: 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
    },
};

// Order Status Configuration
export const ORDER_STATUS_CONFIG = {
    pending: {
        color: COLORS.orderPending,
        bgColor: COLORS.warningSoft,
        icon: 'clock-outline',
        label: 'Pending',
    },
    assigned_to_company: {
        color: COLORS.orderAssignedCompany,
        bgColor: COLORS.primarySoft,
        icon: 'office-building',
        label: 'Assigned to Company',
    },
    assigned_to_driver: {
        color: COLORS.orderAssignedDriver,
        bgColor: COLORS.secondarySoft,
        icon: 'account',
        label: 'Assigned to Driver',
    },
    picked_up: {
        color: COLORS.orderPickedUp,
        bgColor: '#ECFEFF',
        icon: 'package-variant',
        label: 'Picked Up',
    },
    in_transit: {
        color: COLORS.orderInTransit,
        bgColor: COLORS.accentSoft,
        icon: 'truck-delivery',
        label: 'In Transit',
    },
    delivered: {
        color: COLORS.orderDelivered,
        bgColor: COLORS.successSoft,
        icon: 'check-circle',
        label: 'Delivered',
    },
    cancelled: {
        color: COLORS.orderCancelled,
        bgColor: COLORS.errorSoft,
        icon: 'close-circle',
        label: 'Cancelled',
    },
};

// Payment Method Configuration
export const PAYMENT_METHOD_CONFIG = {
    cash: {
        icon: 'cash',
        label: 'Cash on Delivery',
        color: COLORS.success,
    },
    card: {
        icon: 'credit-card',
        label: 'Credit Card',
        color: COLORS.primary,
    },
    online: {
        icon: 'web',
        label: 'Online Payment',
        color: COLORS.secondary,
    },
};

// Item Type Configuration
export const ITEM_TYPE_CONFIG = {
    bag: {
        icon: 'bag-personal',
        label: 'Bag',
    },
    envelope: {
        icon: 'email',
        label: 'Envelope',
    },
    small_box: {
        icon: 'package-variant-closed',
        label: 'Small Box',
    },
    medium_box: {
        icon: 'package-variant',
        label: 'Medium Box',
    },
    large_box: {
        icon: 'cube',
        label: 'Large Box',
    },
    custom: {
        icon: 'shape',
        label: 'Custom',
    },
};

// Export all
export default {
    SCREEN,
    COLORS,
    FONTS,
    FONT_SIZES,
    LINE_HEIGHTS,
    SPACING,
    RADIUS,
    SHADOWS,
    Z_INDEX,
    ANIMATION,
    ICON_SIZES,
    BUTTON_HEIGHTS,
    INPUT_HEIGHTS,
    CARD_STYLE,
    CONTAINER_PADDING,
    API_CONFIG,
    SOCKET_CONFIG,
    STORAGE_KEYS,
    NOTIFICATION_CHANNELS,
    ORDER_STATUS_CONFIG,
    PAYMENT_METHOD_CONFIG,
    ITEM_TYPE_CONFIG,
};
