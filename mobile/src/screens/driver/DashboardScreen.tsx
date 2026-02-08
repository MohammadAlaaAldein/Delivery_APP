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
    Switch,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, StatCard, OrderCard, Loading, EmptyState } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useAuthStore, useOrdersStore } from '../../stores';
import { entitiesService } from '../../services';
import { t } from '../../i18n';
import { DriverStackParamList, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList, 'Dashboard'>;

const DriverDashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const { orders, activeOrders: storeActiveOrders, driverStats, isLoading, fetchDriverOrders, fetchDriverStats } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([fetchDriverOrders(), fetchDriverStats()]);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const allDriverOrders = storeActiveOrders.length > 0 ? storeActiveOrders : orders;

    const activeOrders = allDriverOrders.filter(
        (o) => [OrderStatus.ASSIGNED_TO_DRIVER, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status as OrderStatus)
    );

    const pendingPickup = allDriverOrders.filter((o) => o.status === OrderStatus.ASSIGNED_TO_DRIVER);
    const inProgress = allDriverOrders.filter(
        (o) => [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status as OrderStatus)
    );

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const handleViewActiveOrders = () => {
        navigation.navigate('ActiveOrders');
    };

    const handleViewHistory = () => {
        navigation.navigate('History');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.goodMorning');
        if (hour < 18) return t('dashboard.goodAfternoon');
        return t('dashboard.goodEvening');
    };

    if (isLoading && allDriverOrders.length === 0) {
        return <Loading fullScreen message={t('dashboard.loadingDashboard')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <LinearGradient
                colors={['#10B981', '#059669'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.name || 'Driver'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.getParent()?.navigate('Profile')}>
                            <Ionicons name="person-outline" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Online Toggle */}
                <View style={styles.onlineToggle}>
                    <View style={styles.onlineInfo}>
                        <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
                        <Text style={styles.onlineText}>
                            {isOnline ? t('driver.youAreOnline') : t('driver.youAreOffline')}
                        </Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={async (value) => {
                            setIsOnline(value);
                            try {
                                if (value) {
                                    // Send a dummy location update to mark as active
                                    await entitiesService.updateDriverLocation(0, 0);
                                } else {
                                    await entitiesService.clearDriverLocation();
                                }
                            } catch (err) {
                                console.log('Toggle online status error:', err);
                            }
                        }}
                        trackColor={{ false: 'rgba(255,255,255,0.3)', true: COLORS.white }}
                        thumbColor={isOnline ? COLORS.success : COLORS.gray400}
                    />
                </View>

                {/* Earnings Card */}
                <View style={styles.earningsCard}>
                    <View style={styles.earningsMain}>
                        <Text style={styles.earningsLabel}>{t('driver.todayEarnings')}</Text>
                        <Text style={styles.earningsValue}>
                            ${Number(driverStats?.todayEarnings || 0).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.earningsDivider} />
                    <View style={styles.earningsStats}>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earnStatValue}>{driverStats?.todayDeliveries || 0}</Text>
                            <Text style={styles.earnStatLabel}>{t('dashboard.todayDeliveries')}</Text>
                        </View>
                        <View style={styles.earningsStat}>
                            <Text style={styles.earnStatValue}>
                                {Number(driverStats?.todayDistance || 0).toFixed(1)} km
                            </Text>
                            <Text style={styles.earnStatLabel}>{t('driver.distance')}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={handleViewActiveOrders}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primarySoft }]}>
                            <Ionicons name="cube" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.quickActionTitle}>{t('dashboard.activeOrders')}</Text>
                        <View style={styles.quickActionBadge}>
                            <Text style={styles.badgeText}>{activeOrders.length}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={handleViewHistory}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.successSoft }]}>
                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        </View>
                        <Text style={styles.quickActionTitle}>{t('nav.orderHistory')}</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>{t('driver.stats')}</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title={t('driver.pendingPickup')}
                            value={pendingPickup.length}
                            icon="archive-outline"
                            color={COLORS.warning}
                        />
                        <StatCard
                            title={t('driver.inProgress')}
                            value={inProgress.length}
                            icon="car-outline"
                            color={COLORS.info}
                        />
                        <StatCard
                            title={t('driver.completedToday')}
                            value={driverStats?.todayDeliveries || 0}
                            icon="checkmark-circle-outline"
                            color={COLORS.success}
                        />
                        <StatCard
                            title={t('driver.rating')}
                            value={Number(driverStats?.rating || 4.8).toFixed(1)}
                            icon="star-outline"
                            color={COLORS.warning}
                        />
                    </View>
                </View>

                {/* Active Orders */}
                <View style={styles.ordersSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('driver.activeOrders')}</Text>
                        {activeOrders.length > 0 && (
                            <TouchableOpacity onPress={handleViewActiveOrders}>
                                <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {activeOrders.length > 0 ? (
                        activeOrders.slice(0, 3).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onPress={() => handleOrderPress(order.id)}
                            />
                        ))
                    ) : (
                        <EmptyState
                            title={t('driver.noActiveOrders')}
                            description={t('orders.noActiveDeliveriesDesc')}
                            icon="car-outline"
                        />
                    )}
                </View>

                {/* Performance Card */}
                <Card style={styles.performanceCard}>
                    <Text style={styles.performanceTitle}>{t('driver.thisWeekPerformance')}</Text>
                    <View style={styles.performanceRow}>
                        <View style={styles.performanceItem}>
                            <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
                            <Text style={styles.perfValue}>{driverStats?.weeklyDeliveries || 0}</Text>
                            <Text style={styles.perfLabel}>{t('dashboard.deliveredOrders')}</Text>
                        </View>
                        <View style={styles.performanceItem}>
                            <Ionicons name="time" size={24} color={COLORS.info} />
                            <Text style={styles.perfValue}>{'--'}</Text>
                            <Text style={styles.perfLabel}>{t('driver.avgTime')}</Text>
                        </View>
                        <View style={styles.performanceItem}>
                            <Ionicons name="cash" size={24} color={COLORS.warning} />
                            <Text style={styles.perfValue}>
                                ${Number(driverStats?.weekEarnings || 0).toFixed(0)}
                            </Text>
                            <Text style={styles.perfLabel}>{t('driver.earned')}</Text>
                        </View>
                    </View>
                </Card>
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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
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
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    onlineInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.gray400,
        marginRight: SPACING.sm,
    },
    statusDotOnline: {
        backgroundColor: COLORS.white,
    },
    onlineText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.white,
    },
    earningsCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        padding: SPACING.base,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    earningsMain: {
        flex: 1,
    },
    earningsLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    earningsValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['3xl'],
        color: COLORS.gray900,
        marginTop: SPACING.xs,
    },
    earningsDivider: {
        width: 1,
        height: 50,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    earningsStats: {
        alignItems: 'flex-end',
    },
    earningsStat: {
        alignItems: 'flex-end',
        marginBottom: SPACING.xs,
    },
    earnStatValue: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    earnStatLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    quickActions: {
        flexDirection: 'row',
        padding: SPACING.base,
    },
    quickAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginHorizontal: SPACING.xs,
        ...SHADOWS.sm,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    quickActionTitle: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
    },
    quickActionBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    badgeText: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xs,
        color: COLORS.white,
    },
    statsSection: {
        paddingHorizontal: SPACING.base,
        marginBottom: SPACING.md,
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
    ordersSection: {
        paddingHorizontal: SPACING.base,
        marginBottom: SPACING.md,
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
    performanceCard: {
        marginHorizontal: SPACING.base,
        padding: SPACING.base,
    },
    performanceTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginBottom: SPACING.md,
    },
    performanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    performanceItem: {
        alignItems: 'center',
    },
    perfValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
        marginTop: SPACING.xs,
    },
    perfLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: 2,
    },
});

export default DriverDashboardScreen;

