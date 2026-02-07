// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, StatCard, OrderCard, Loading, EmptyState, Button } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, SCREEN } from '../../constants';
import { useAuthStore, useOrdersStore } from '../../stores';
import { t } from '../../i18n';
import { ShopStackParamList, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<ShopStackParamList, 'Dashboard'>;

const ShopDashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const { orders, shopStats, isLoading, fetchShopOrders, fetchShopStats } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([fetchShopOrders(), fetchShopStats()]);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];

    const handleCreateOrder = () => {
        navigation.navigate('CreateOrder');
    };

    const handleViewAllOrders = () => {
        navigation.navigate('Orders');
    };

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (isLoading && orders.length === 0) {
        return <Loading fullScreen message="Loading dashboard..." />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={COLORS.gradientPrimary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.shop?.name || user?.name || 'Shop'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.notificationBtn} onPress={() => Alert.alert(t('notifications.title'), t('notifications.noNotifications'))}>
                            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.getParent()?.navigate('Profile')}>
                            <Ionicons name="person-outline" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Create Order Quick Action */}
                <TouchableOpacity
                    style={styles.quickAction}
                    onPress={handleCreateOrder}
                    activeOpacity={0.9}
                >
                    <View style={styles.quickActionContent}>
                        <View style={styles.quickActionIcon}>
                            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                        </View>
                        <View style={styles.quickActionText}>
                            <Text style={styles.quickActionTitle}>Create New Order</Text>
                            <Text style={styles.quickActionSubtitle}>
                                Start a new delivery request
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.gray400} />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>{t('shop.stats')}</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title={t('shop.pendingOrders')}
                            value={shopStats?.pendingOrders || 0}
                            icon="time-outline"
                            color={COLORS.warning}
                            trend={5}
                        />
                        <StatCard
                            title={t('shop.activeOrders')}
                            value={shopStats?.inProgressOrders || 0}
                            icon="sync-outline"
                            color={COLORS.info}
                        />
                        <StatCard
                            title={t('shop.deliveredOrders')}
                            value={shopStats?.deliveredOrders || 0}
                            icon="checkmark-circle-outline"
                            color={COLORS.success}
                            trend={12}
                        />
                        <StatCard
                            title={t('shop.totalOrders')}
                            value={shopStats?.totalOrders || 0}
                            icon="cube-outline"
                            color={COLORS.primary}
                        />
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <Card style={styles.quickStatCard}>
                        <View style={styles.quickStatRow}>
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatValue}>
                                    ${Number(shopStats?.todayRevenue || 0).toFixed(2)}
                                </Text>
                                <Text style={styles.quickStatLabel}>Today's Revenue</Text>
                            </View>
                            <View style={styles.quickStatDivider} />
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatValue}>{shopStats?.todayOrders || 0}</Text>
                                <Text style={styles.quickStatLabel}>Today's Orders</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Recent Orders */}
                <View style={styles.recentOrders}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('shop.recentOrders')}</Text>
                        <TouchableOpacity onPress={handleViewAllOrders}>
                            <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onPress={() => handleOrderPress(order.id)}
                                compact
                            />
                        ))
                    ) : (
                        <EmptyState
                            title={t('shop.noOrders')}
                            description="Start by creating your first order"
                            icon="cube-outline"
                            actionLabel="Create Order"
                            onAction={handleCreateOrder}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateOrder}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={COLORS.gradientPrimary as [string, string]}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color={COLORS.white} />
                </LinearGradient>
            </TouchableOpacity>
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.white,
        marginTop: SPACING.xs,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.error,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.base,
        ...SHADOWS.md,
    },
    quickActionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    quickActionText: {
        flex: 1,
    },
    quickActionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    quickActionSubtitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    statsContainer: {
        padding: SPACING.base,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
        marginBottom: SPACING.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SPACING.xs,
    },
    quickStats: {
        paddingHorizontal: SPACING.base,
        marginBottom: SPACING.md,
    },
    quickStatCard: {
        padding: SPACING.base,
    },
    quickStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
    },
    quickStatLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: SPACING.xs,
    },
    quickStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
    },
    recentOrders: {
        paddingHorizontal: SPACING.base,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    viewAll: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.base,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
});

export default ShopDashboardScreen;

