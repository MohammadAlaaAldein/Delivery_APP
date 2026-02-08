// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Badge, Loading, Button, Divider } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ORDER_STATUS_CONFIG } from '../../constants';
import { useOrdersStore } from '../../stores';
import { t } from '../../i18n';
import { ShopStackParamList, Order, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<ShopStackParamList, 'OrderDetail'>;
type RouteProps = RouteProp<ShopStackParamList, 'OrderDetail'>;

const OrderDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { orderId } = route.params;
    const { orders, cancelOrder, isLoading } = useOrdersStore();

    const [order, setOrder] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const foundOrder = orders.find((o) => String(o.id) === String(orderId));
        setOrder(foundOrder || null);
    }, [orderId, orders]);

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleCancel = () => {
        if (!order) return;

        Alert.alert(
            t('orders.cancelOrder'),
            t('orders.confirmCancel'),
            [
                { text: t('common.no'), style: 'cancel' },
                {
                    text: t('orders.yesCancel'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsCancelling(true);
                        try {
                            await cancelOrder(order.id);
                            Alert.alert(t('common.success'), t('orders.orderCancelled'));
                        } catch (err: any) {
                            Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to cancel order');
                        } finally {
                            setIsCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading || !order) {
        return <Loading fullScreen message={t('orders.loadingDetails')} />;
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG[OrderStatus.PENDING];

    const renderTimeline = () => {
        const statuses = [
            { status: OrderStatus.PENDING, label: t('orders.status.pending'), time: order.created_at },
            { status: OrderStatus.ASSIGNED_TO_COMPANY, label: t('orders.status.assigned_to_company'), time: order.company_assigned_at },
            { status: OrderStatus.ASSIGNED_TO_DRIVER, label: t('orders.status.assigned_to_driver'), time: order.driver_assigned_at },
            { status: OrderStatus.PICKED_UP, label: t('orders.status.picked_up'), time: order.picked_up_at },
            { status: OrderStatus.IN_TRANSIT, label: t('orders.status.in_transit'), time: null },
            { status: OrderStatus.DELIVERED, label: t('orders.status.delivered'), time: order.delivered_at },
        ];

        const currentIndex = statuses.findIndex((s) => s.status === order.status);

        return (
            <View style={styles.timeline}>
                {statuses.map((item, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = item.status === order.status;
                    const isCancelled = order.status === OrderStatus.CANCELLED;

                    return (
                        <View key={item.status} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View
                                    style={[
                                        styles.timelineDot,
                                        isCompleted && styles.timelineDotCompleted,
                                        isCurrent && styles.timelineDotCurrent,
                                        isCancelled && styles.timelineDotCancelled,
                                    ]}
                                >
                                    {isCompleted && !isCancelled && (
                                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                    )}
                                    {isCancelled && index === currentIndex && (
                                        <Ionicons name="close" size={12} color={COLORS.white} />
                                    )}
                                </View>
                                {index < statuses.length - 1 && (
                                    <View
                                        style={[
                                            styles.timelineLine,
                                            isCompleted && !isCurrent && styles.timelineLineCompleted,
                                        ]}
                                    />
                                )}
                            </View>
                            <View style={styles.timelineContent}>
                                <Text
                                    style={[
                                        styles.timelineLabel,
                                        isCompleted && styles.timelineLabelCompleted,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {item.time && (
                                    <Text style={styles.timelineTime}>
                                        {new Date(item.time).toLocaleString()}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={[statusConfig.color, COLORS.gray900] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('orders.orderDetails')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderNumber}>#{order.order_number}</Text>
                        <Text style={styles.orderDate}>
                            {new Date(order.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <Ionicons
                            name={statusConfig.icon as any}
                            size={16}
                            color={statusConfig.color}
                        />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Customer Info */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('orders.customerInfo')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('common.name')}</Text>
                        <Text style={styles.infoValue}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('orders.customerPhone')}</Text>
                        <TouchableOpacity
                            style={styles.phoneButton}
                            onPress={() => handleCall(order.customer_phone)}
                        >
                            <Text style={styles.phoneText}>{order.customer_phone}</Text>
                            <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Divider />
                    <View style={styles.addressContainer}>
                        <Ionicons name="location-outline" size={20} color={COLORS.gray500} />
                        <Text style={styles.addressText}>{order.delivery_address}</Text>
                    </View>
                </Card>

                {/* Order Items */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('orders.orderItems')} ({order.order_items?.length || 0})</Text>
                    </View>
                    {order.order_items?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.description || item.name || item.type}</Text>
                                <Text style={styles.itemMeta}>
                                    {item.type} • Qty: {item.count || item.quantity || 1}
                                </Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                ${Number(item.price || 0).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <Divider />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('orders.subtotal')}</Text>
                        <Text style={styles.totalValue}>
                            ${Number(order.order_amount || 0).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('orders.deliveryFee')}</Text>
                        <Text style={styles.totalValue}>${Number(order.delivery_fee || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>{t('orders.totalAmount')}</Text>
                        <Text style={styles.grandTotalValue}>${Number(order.total_amount || 0).toFixed(2)}</Text>
                    </View>
                </Card>

                {/* Payment Info */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('orders.paymentInfo')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Method</Text>
                        <Badge
                            label={order.payment_method || 'Cash'}
                            variant="secondary"
                        />
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Badge
                            label={order.payment_status || 'Pending'}
                            variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                        />
                    </View>
                </Card>

                {/* Driver Info */}
                {order.driver && (
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="car-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>{t('orders.driver')}</Text>
                        </View>
                        <View style={styles.driverInfo}>
                            <View style={styles.driverAvatar}>
                                <Ionicons name="person" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.driverDetails}>
                                <Text style={styles.driverName}>{order.driver.name}</Text>
                                <Text style={styles.driverPhone}>{order.driver.phone}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleCall(order.driver!.phone)}
                            >
                                <Ionicons name="call" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

                {/* Company Info */}
                {order.company && (
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="business-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>{t('orders.deliveryCompany')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('common.name')}</Text>
                            <Text style={styles.infoValue}>{order.company.name}</Text>
                        </View>
                    </Card>
                )}

                {/* Order Timeline */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>{t('orders.timeline')}</Text>
                    </View>
                    {renderTimeline()}
                </Card>

                {/* Notes */}
                {order.notes && (
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>{t('common.notes')}</Text>
                        </View>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </Card>
                )}

                {/* Track on Map - show for in-transit orders */}
                {(order.status === OrderStatus.PICKED_UP ||
                    order.status === OrderStatus.IN_TRANSIT ||
                    order.status === OrderStatus.ASSIGNED_TO_DRIVER) && (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.primary,
                            paddingVertical: SPACING.md,
                            borderRadius: RADIUS.lg,
                            marginBottom: SPACING.md,
                            ...SHADOWS.md,
                        }}
                        onPress={() => navigation.navigate('OrderTracking' as any, { orderId: order.id })}
                    >
                        <Ionicons name="map-outline" size={20} color={COLORS.white} />
                        <Text style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: FONT_SIZES.base,
                            color: COLORS.white,
                            marginLeft: SPACING.sm,
                        }}>
                            {t('orders.trackOnMap', 'تتبع على الخريطة')}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Actions */}
                {order.status === OrderStatus.PENDING && (
                    <Button
                        title="Cancel Order"
                        onPress={handleCancel}
                        variant="danger"
                        loading={isCancelling}
                        fullWidth
                        icon="close-circle-outline"
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.xl,
        borderBottomLeftRadius: RADIUS['2xl'],
        borderBottomRightRadius: RADIUS['2xl'],
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.white,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNumber: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.white,
    },
    orderDate: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: 'rgba(255,255,255,0.7)',
        marginTop: SPACING.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
    },
    statusText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.sm,
        marginLeft: SPACING.xs,
    },
    scrollContent: {
        padding: SPACING.base,
        paddingBottom: SPACING['2xl'],
    },
    section: {
        marginBottom: SPACING.md,
        padding: SPACING.base,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginLeft: SPACING.sm,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    infoLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    infoValue: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray900,
    },
    phoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primarySoft,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    phoneText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        marginRight: SPACING.xs,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: SPACING.md,
    },
    addressText: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        marginLeft: SPACING.sm,
        lineHeight: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    itemMeta: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    itemPrice: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    totalLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    totalValue: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    grandTotalLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    grandTotalValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.primary,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverDetails: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    driverName: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    driverPhone: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeline: {
        marginTop: SPACING.sm,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.gray200,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray300,
    },
    timelineDotCompleted: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    timelineDotCurrent: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        transform: [{ scale: 1.1 }],
    },
    timelineDotCancelled: {
        backgroundColor: COLORS.error,
        borderColor: COLORS.error,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: COLORS.gray200,
        marginVertical: 4,
    },
    timelineLineCompleted: {
        backgroundColor: COLORS.success,
    },
    timelineContent: {
        flex: 1,
        marginLeft: SPACING.sm,
        paddingBottom: SPACING.md,
    },
    timelineLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
    },
    timelineLabelCompleted: {
        color: COLORS.gray900,
    },
    timelineTime: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: 2,
    },
    notesText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        lineHeight: 20,
    },
});

export default OrderDetailScreen;

