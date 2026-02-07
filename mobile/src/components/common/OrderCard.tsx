import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Order, OrderStatus } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ORDER_STATUS_CONFIG } from '../../constants';
import { Badge } from './Card';
import { t } from '../../i18n';

interface OrderCardProps {
    order: Order;
    onPress?: () => void;
    showShop?: boolean;
    showCompany?: boolean;
    showDriver?: boolean;
    showActions?: boolean;
    variant?: 'default' | 'compact' | 'detailed';
    compact?: boolean; // Shorthand for variant='compact'
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    onPress,
    showShop = false,
    showCompany = false,
    showDriver = false,
    showActions = false,
    variant = 'default',
    compact = false,
}) => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || {
        color: COLORS.gray500,
        bgColor: COLORS.gray100,
        icon: 'help-circle-outline',
        label: order.status || 'Unknown',
    };
    const effectiveVariant = compact ? 'compact' : variant;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        amount ||= 0.00;
        return `${amount} JOD`;
    };

    if (effectiveVariant === 'compact') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.compactCard, SHADOWS.sm]}
            >
                <View style={styles.compactLeft}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                    <View>
                        <Text style={styles.orderNumber}>#{order.order_number}</Text>
                        <Text style={styles.customerNameSmall}>{order.customer_name}</Text>
                    </View>
                </View>
                <View style={styles.compactRight}>
                    <Text style={styles.totalAmountSmall}>{formatCurrency(order.total_amount)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.card, SHADOWS.base]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>#{order.order_number}</Text>
                    <Text style={styles.date}>{formatDate(order.created_at)}</Text>
                </View>
                <Badge
                    text={String(t(`orders.status.${order.status}`) || statusConfig.label)}
                    variant={
                        order.status === OrderStatus.DELIVERED
                            ? 'success'
                            : order.status === OrderStatus.CANCELLED
                                ? 'danger'
                                : order.status === OrderStatus.PENDING
                                    ? 'warning'
                                    : 'primary'
                    }
                    size="sm"
                />
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color={COLORS.gray500} />
                    <Text style={styles.customerName}>{order.customer_name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={18} color={COLORS.gray500} />
                    <Text style={styles.infoText}>{order.customer_phone}</Text>
                </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color={COLORS.gray500} />
                    <Text style={styles.infoText} numberOfLines={2}>
                        {String(order.delivery_address || `${order.delivery_city || ''}, ${order.delivery_area || ''}`)}
                    </Text>
                </View>
            </View>

            {/* Entities */}
            {(showShop || showCompany || showDriver) && (
                <View style={styles.entitiesSection}>
                    {showShop && order.shop && (
                        <View style={styles.entityBadge}>
                            <Ionicons name="storefront-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.entityText}>{order.shop.name}</Text>
                        </View>
                    )}
                    {showCompany && order.company && (
                        <View style={styles.entityBadge}>
                            <Ionicons name="business-outline" size={14} color={COLORS.secondary} />
                            <Text style={styles.entityText}>{order.company.name}</Text>
                        </View>
                    )}
                    {showDriver && order.driver && (
                        <View style={styles.entityBadge}>
                            <Ionicons name="car-outline" size={14} color={COLORS.accent} />
                            <Text style={styles.entityText}>{order.driver.user?.name || 'Driver'}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Items Summary */}
            {order.order_items && order.order_items.length > 0 && (
                <View style={styles.itemsSummary}>
                    <Text style={styles.itemsText}>
                        {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </Text>
                    {order.requires_large_vehicle && (
                        <View style={styles.largeVehicleBadge}>
                            <Ionicons name="car" size={12} color={COLORS.warning} />
                            <Text style={styles.largeVehicleText}>Large Vehicle</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.paymentInfo}>
                    <Ionicons
                        name={order.payment_method === 'cash' ? 'cash-outline' : 'card-outline'}
                        size={16}
                        color={COLORS.gray500}
                    />
                    <Text style={styles.paymentText}>{String(t(`orders.paymentMethods.${order.payment_method}`) || order.payment_method || 'N/A')}</Text>
                    {order.is_paid && (
                        <View style={styles.paidBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                            <Text style={styles.paidText}>Paid</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.totalAmount}>{formatCurrency(order.total_amount)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.md,
    },
    compactCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.base,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compactRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    orderInfo: {},
    orderNumber: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    date: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: 2,
    },
    section: {
        marginBottom: SPACING.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    customerName: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray800,
        marginLeft: SPACING.sm,
    },
    customerNameSmall: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
    },
    infoText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: SPACING.sm,
        flex: 1,
    },
    entitiesSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.sm,
        gap: SPACING.xs,
    },
    entityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        paddingVertical: SPACING.xs / 2,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.sm,
    },
    entityText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray700,
        marginLeft: 4,
    },
    itemsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        marginTop: SPACING.xs,
    },
    itemsText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
    },
    largeVehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warningSoft,
        paddingVertical: 2,
        paddingHorizontal: SPACING.xs,
        borderRadius: RADIUS.xs,
    },
    largeVehicleText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.warning,
        marginLeft: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        marginTop: SPACING.xs,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: 4,
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    paidText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        color: COLORS.success,
        marginLeft: 2,
    },
    totalAmount: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    totalAmountSmall: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginRight: SPACING.sm,
    },
});

export default OrderCard;
