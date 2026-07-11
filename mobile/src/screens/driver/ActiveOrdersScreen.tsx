// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Badge, Loading, EmptyState, Button } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ORDER_STATUS_CONFIG } from '../../constants';
import { useOrdersStore } from '../../stores';
import { ordersService } from '../../services';
import { t } from '../../i18n';
import { DriverStackParamList, Order, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList, 'ActiveOrders'>;

const ActiveOrdersScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { activeOrders: storeActiveOrders, orders, isLoading, fetchDriverOrders } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const allOrders = storeActiveOrders.length > 0 ? storeActiveOrders : orders;
    const activeOrders = allOrders.filter(
        (o) => [OrderStatus.ASSIGNED_TO_DRIVER, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status as OrderStatus)
    );

    useEffect(() => {
        fetchDriverOrders();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDriverOrders();
        setRefreshing(false);
    }, []);

    const handlePickup = async (order: Order) => {
        Alert.alert(
            'Confirm Pickup',
            `Have you picked up order #${order.order_number}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setActionLoading(order.id);
                        try {
                            await ordersService.pickupOrder(order.id);
                            Alert.alert('Success', 'Order marked as picked up');
                            fetchDriverOrders();
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to update order');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleStartDelivery = async (order: Order) => {
        setActionLoading(order.id);
        try {
            await ordersService.startDelivery(order.id);
            Alert.alert('Success', 'Delivery started');
            fetchDriverOrders();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to start delivery');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeliver = async (order: Order) => {
        Alert.alert(
            'Confirm Delivery',
            `Has order #${order.order_number} been delivered?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setActionLoading(order.id);
                        try {
                            await ordersService.deliverOrder(order.id);
                            Alert.alert('Success', 'Order delivered successfully!');
                            fetchDriverOrders();
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to complete delivery');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const openNavigation = (lat?: number, lng?: number, address?: string) => {
        if (lat && lng) {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        } else if (address) {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
        }
    };

    const handleNavigateToShop = (order: Order) => {
        openNavigation(
            Number(order.shop?.latitude) || undefined,
            Number(order.shop?.longitude) || undefined,
            order.shop?.address,
        );
    };

    const handleNavigateToCustomer = (order: Order) => {
        openNavigation(
            Number(order.delivery_latitude) || undefined,
            Number(order.delivery_longitude) || undefined,
            order.delivery_address,
        );
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const getActionButton = (order: Order) => {
        const isCurrentOrderLoading = actionLoading === order.id;

        switch (order.status) {
            case OrderStatus.ASSIGNED_TO_DRIVER:
                return (
                    <Button
                        title="Pick Up"
                        onPress={() => handlePickup(order)}
                        loading={isCurrentOrderLoading}
                        icon="archive-outline"
                        variant="warning"
                        size="sm"
                    />
                );
            case OrderStatus.PICKED_UP:
                return (
                    <Button
                        title="Start Delivery"
                        onPress={() => handleStartDelivery(order)}
                        loading={isCurrentOrderLoading}
                        icon="car-outline"
                        variant="primary"
                        size="sm"
                    />
                );
            case OrderStatus.IN_TRANSIT:
                return (
                    <Button
                        title="Delivered"
                        onPress={() => handleDeliver(order)}
                        loading={isCurrentOrderLoading}
                        icon="checkmark-circle-outline"
                        variant="success"
                        size="sm"
                    />
                );
            default:
                return null;
        }
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const statusConfig = ORDER_STATUS_CONFIG[item.status] || ORDER_STATUS_CONFIG[OrderStatus.PENDING];

        return (
            <Card style={styles.orderCard}>
                <TouchableOpacity
                    onPress={() => handleOrderPress(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderNumber}>#{item.order_number}</Text>
                            <Text style={styles.orderTime}>
                                {new Date(item.created_at).toLocaleTimeString()}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.customerSection}>
                        <View style={styles.customerRow}>
                            <Ionicons name="person-outline" size={18} color={COLORS.gray500} />
                            <Text style={styles.customerName}>{item.customer_name}</Text>
                            <TouchableOpacity
                                style={styles.callBtn}
                                onPress={() => handleCall(item.customer_phone)}
                            >
                                <Ionicons name="call" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Addresses */}
                    <View style={styles.addressSection}>
                        <View style={styles.addressRow}>
                            <View style={styles.addressDot}>
                                <Ionicons name="storefront" size={14} color={COLORS.primary} />
                            </View>
                            <View style={styles.addressContent}>
                                <Text style={styles.addressLabel}>Pickup from</Text>
                                <Text style={styles.addressText}>{item.shop?.address || 'Shop address'}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.navigateBtn}
                                onPress={() => handleNavigateToShop(item)}
                            >
                                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.addressLine} />
                        <View style={styles.addressRow}>
                            <View style={[styles.addressDot, { backgroundColor: COLORS.successSoft }]}>
                                <Ionicons name="location" size={14} color={COLORS.success} />
                            </View>
                            <View style={styles.addressContent}>
                                <Text style={styles.addressLabel}>Deliver to</Text>
                                <Text style={styles.addressText}>{item.delivery_address}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.navigateBtn}
                                onPress={() => handleNavigateToCustomer(item)}
                            >
                                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Items Info */}
                    <View style={styles.itemsInfo}>
                        <Ionicons name="cube-outline" size={16} color={COLORS.gray500} />
                        <Text style={styles.itemsText}>
                            {item.order_items?.length || 0} item(s) • {item.order_items?.[0]?.type || 'Package'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Action Footer */}
                <View style={styles.orderFooter}>
                    <View style={styles.paymentInfo}>
                        <Text style={styles.paymentLabel}>
                            {item.payment_method} • {item.payment_status}
                        </Text>
                        <Text style={styles.paymentAmount}>${Number(item.total_amount || 0).toFixed(2)}</Text>
                    </View>
                    {getActionButton(item)}
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('driver.activeOrders')}</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Badge
                        label={`${activeOrders.filter((o) => o.status === OrderStatus.ASSIGNED_TO_DRIVER).length}`}
                        variant="warning"
                    />
                    <Text style={styles.summaryLabel}>To Pickup</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Badge
                        label={`${activeOrders.filter((o) => [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status as OrderStatus)).length}`}
                        variant="primary"
                    />
                    <Text style={styles.summaryLabel}>In Transit</Text>
                </View>
            </View>

            {isLoading && activeOrders.length === 0 ? (
                <Loading fullScreen message="Loading orders..." />
            ) : (
                <FlatList
                    data={activeOrders}
                        keyExtractor={(item) => String(item.id)}
                    renderItem={renderOrder}
                    ListEmptyComponent={
                        <EmptyState
                            title={t('driver.noActiveOrders')}
                            description="You don't have any active deliveries"
                            icon="car-outline"
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.sm,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
    },
    summaryLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginLeft: SPACING.sm,
    },
    listContent: {
        padding: SPACING.base,
        paddingBottom: SPACING.xl,
    },
    orderCard: {
        marginBottom: SPACING.md,
        padding: SPACING.base,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    orderNumber: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    orderTime: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    statusText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        marginLeft: 4,
    },
    customerSection: {
        marginBottom: SPACING.md,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customerName: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray800,
        marginLeft: SPACING.sm,
    },
    callBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressSection: {
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressLine: {
        width: 2,
        height: 20,
        backgroundColor: COLORS.border,
        marginLeft: 13,
        marginVertical: 4,
    },
    addressContent: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    addressLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
    },
    addressText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray800,
        marginTop: 2,
    },
    navigateBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    itemsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    itemsText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: SPACING.sm,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    paymentInfo: {},
    paymentLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        textTransform: 'capitalize',
    },
    paymentAmount: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
        marginTop: 2,
    },
});

export default ActiveOrdersScreen;

