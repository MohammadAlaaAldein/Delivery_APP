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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, StatCard, OrderCard, Loading, EmptyState } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useAuthStore, useOrdersStore } from '../../stores';
import { t } from '../../i18n';
import { CompanyStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<CompanyStackParamList, 'Dashboard'>;

const CompanyDashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, logout } = useAuthStore();
    const { orders, stats, isLoading, fetchCompanyOrders, fetchStats } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([fetchCompanyOrders(), fetchStats()]);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const activeOrders = orders.filter(
        (o) => ['assigned_to_company', 'assigned_to_driver', 'picked_up', 'in_transit'].includes(o.status)
    );

    const handleViewAvailableOrders = () => {
        navigation.navigate('AvailableOrders');
    };

    const handleViewDrivers = () => {
        navigation.navigate('Drivers');
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
                colors={['#6366F1', '#4F46E5'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.company?.name || user?.name || 'Company'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                            {pendingOrders.length > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>{pendingOrders.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileBtn} onPress={logout}>
                            <Ionicons name="person-outline" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionCard}
                        onPress={handleViewAvailableOrders}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningSoft }]}>
                            <Ionicons name="cube-outline" size={24} color={COLORS.warning} />
                        </View>
                        <Text style={styles.quickActionTitle}>Available Orders</Text>
                        <Text style={styles.quickActionCount}>{pendingOrders.length}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionCard}
                        onPress={handleViewDrivers}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.successSoft }]}>
                            <Ionicons name="people-outline" size={24} color={COLORS.success} />
                        </View>
                        <Text style={styles.quickActionTitle}>Drivers</Text>
                        <Text style={styles.quickActionCount}>{stats?.driversCount || 0}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>{t('company.stats')}</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title={t('company.pendingOrders')}
                            value={stats?.pending || 0}
                            icon="time-outline"
                            color={COLORS.warning}
                        />
                        <StatCard
                            title={t('company.activeDeliveries')}
                            value={stats?.active || 0}
                            icon="sync-outline"
                            color={COLORS.info}
                        />
                        <StatCard
                            title={t('company.completedToday')}
                            value={stats?.completedToday || 0}
                            icon="checkmark-circle-outline"
                            color={COLORS.success}
                            trend={8}
                        />
                        <StatCard
                            title={t('company.totalRevenue')}
                            value={`$${stats?.revenue?.toFixed(0) || 0}`}
                            icon="cash-outline"
                            color={COLORS.primary}
                            trend={15}
                        />
                    </View>
                </View>

                {/* Active Orders Performance */}
                <Card style={styles.performanceCard}>
                    <View style={styles.performanceHeader}>
                        <Text style={styles.performanceTitle}>Today's Performance</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewDetails}>View Details</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.performanceMetrics}>
                        <View style={styles.metric}>
                            <Text style={styles.metricValue}>{stats?.avgDeliveryTime || '--'}</Text>
                            <Text style={styles.metricLabel}>Avg. Delivery</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={styles.metricValue}>{stats?.successRate || 0}%</Text>
                            <Text style={styles.metricLabel}>Success Rate</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metric}>
                            <Text style={styles.metricValue}>{stats?.activeDrivers || 0}</Text>
                            <Text style={styles.metricLabel}>Active Drivers</Text>
                        </View>
                    </View>
                </Card>

                {/* Active Deliveries */}
                <View style={styles.ordersSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('company.activeDeliveries')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                            <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
                        </TouchableOpacity>
                    </View>

                    {activeOrders.length > 0 ? (
                        activeOrders.slice(0, 5).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onPress={() => handleOrderPress(order.id)}
                                compact
                            />
                        ))
                    ) : (
                        <EmptyState
                            title="No Active Deliveries"
                            description="Accept new orders to start deliveries"
                            icon="car-outline"
                            actionLabel="View Available Orders"
                            onAction={handleViewAvailableOrders}
                        />
                    )}
                </View>

                {/* New Available Orders */}
                {pendingOrders.length > 0 && (
                    <View style={styles.ordersSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.newOrdersHeader}>
                                <Text style={styles.sectionTitle}>New Orders</Text>
                                <View style={styles.newBadge}>
                                    <Text style={styles.newBadgeText}>{pendingOrders.length} NEW</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleViewAvailableOrders}>
                                <Text style={styles.viewAll}>{t('common.viewAll')}</Text>
                            </TouchableOpacity>
                        </View>

                        {pendingOrders.slice(0, 3).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onPress={() => handleOrderPress(order.id)}
                                compact
                            />
                        ))}
                    </View>
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
        top: 6,
        right: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        color: COLORS.white,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        marginHorizontal: -SPACING.xs,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.base,
        marginHorizontal: SPACING.xs,
        ...SHADOWS.md,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    quickActionTitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    quickActionCount: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
        marginTop: SPACING.xs,
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
    performanceCard: {
        marginHorizontal: SPACING.base,
        marginBottom: SPACING.md,
        padding: SPACING.base,
    },
    performanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    performanceTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    viewDetails: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
    },
    performanceMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metric: {
        flex: 1,
        alignItems: 'center',
    },
    metricValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
    },
    metricLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: SPACING.xs,
    },
    metricDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
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
    newOrdersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newBadge: {
        backgroundColor: COLORS.error,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
        marginLeft: SPACING.sm,
    },
    newBadgeText: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        color: COLORS.white,
    },
    viewAll: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
    },
});

export default CompanyDashboardScreen;

