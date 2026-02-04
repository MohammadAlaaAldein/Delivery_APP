// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Badge, Loading, EmptyState } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ORDER_STATUS_CONFIG } from '../../constants';
import { useOrdersStore } from '../../stores';
import { t } from '../../i18n';
import { DriverStackParamList, Order, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList, 'History'>;

const TABS = ['all', 'delivered', 'cancelled'];

const HistoryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { orders, isLoading, fetchDriverOrders } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const completedOrders = orders.filter(
        (o) => [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status as OrderStatus)
    );

    const filteredOrders = completedOrders.filter((order) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'delivered') return order.status === OrderStatus.DELIVERED;
        if (activeTab === 'cancelled') return order.status === OrderStatus.CANCELLED;
        return true;
    });

    useEffect(() => {
        fetchDriverOrders();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDriverOrders();
        setRefreshing(false);
    }, []);

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    // Group orders by date
    const groupedOrders = filteredOrders.reduce((groups: { [key: string]: Order[] }, order) => {
        const date = new Date(order.deliveredAt || order.updatedAt || order.createdAt).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(order);
        return groups;
    }, {});

    const sections = Object.entries(groupedOrders).map(([date, orders]) => ({
        date,
        orders,
        earnings: orders
            .filter((o) => o.status === OrderStatus.DELIVERED)
            .reduce((sum, o) => sum + (o.deliveryFee || 0), 0),
    }));

    const renderOrder = (order: Order) => {
        const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG[OrderStatus.PENDING];

        return (
            <TouchableOpacity
                key={order.id}
                style={styles.orderItem}
                onPress={() => handleOrderPress(order.id)}
            >
                <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
                <View style={styles.orderInfo}>
                    <View style={styles.orderRow}>
                        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                        <Text style={styles.orderAmount}>
                            ${order.deliveryFee?.toFixed(2) || '0.00'}
                        </Text>
                    </View>
                    <Text style={styles.orderAddress} numberOfLines={1}>
                        {order.deliveryAddress}
                    </Text>
                    <View style={styles.orderMeta}>
                        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                        <Text style={[styles.orderStatus, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                        <Text style={styles.orderTime}>
                            {new Date(order.deliveredAt || order.updatedAt || order.createdAt).toLocaleTimeString()}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
        );
    };

    const renderSection = ({ item }: { item: typeof sections[0] }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionDate}>{item.date}</Text>
                <View style={styles.sectionStats}>
                    <Text style={styles.sectionCount}>{item.orders.length} orders</Text>
                    <Text style={styles.sectionEarnings}>${item.earnings.toFixed(2)}</Text>
                </View>
            </View>
            <Card style={styles.sectionCard}>
                {item.orders.map(renderOrder)}
            </Card>
        </View>
    );

    // Calculate stats
    const totalDelivered = completedOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const totalCancelled = completedOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const totalEarnings = completedOrders
        .filter((o) => o.status === OrderStatus.DELIVERED)
        .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('driver.history')}</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Stats Summary */}
            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.successSoft }]}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    </View>
                    <Text style={styles.statValue}>{totalDelivered}</Text>
                    <Text style={styles.statLabel}>Delivered</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.errorSoft }]}>
                        <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    </View>
                    <Text style={styles.statValue}>{totalCancelled}</Text>
                    <Text style={styles.statLabel}>Cancelled</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.warningSoft }]}>
                        <Ionicons name="cash" size={20} color={COLORS.warning} />
                    </View>
                    <Text style={styles.statValue}>${totalEarnings.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Earned</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading && filteredOrders.length === 0 ? (
                <Loading fullScreen message="Loading history..." />
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.date}
                    renderItem={renderSection}
                    ListEmptyComponent={
                        <EmptyState
                            title="No Delivery History"
                            description="Your completed deliveries will appear here"
                            icon="time-outline"
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
    statsCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.base,
        marginTop: SPACING.md,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        ...SHADOWS.sm,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    statValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    statLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        margin: SPACING.base,
        borderRadius: RADIUS.lg,
        padding: 4,
        ...SHADOWS.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: RADIUS.base,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    tabTextActive: {
        color: COLORS.white,
    },
    listContent: {
        padding: SPACING.base,
        paddingTop: 0,
        paddingBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionDate: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
    },
    sectionStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionCount: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginRight: SPACING.md,
    },
    sectionEarnings: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.sm,
        color: COLORS.success,
    },
    sectionCard: {
        padding: 0,
        overflow: 'hidden',
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    statusIndicator: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: SPACING.md,
    },
    orderInfo: {
        flex: 1,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNumber: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    orderAmount: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.base,
        color: COLORS.success,
    },
    orderAddress: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginTop: 2,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    orderStatus: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        marginLeft: 4,
        marginRight: SPACING.md,
    },
    orderTime: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray400,
    },
});

export default HistoryScreen;

