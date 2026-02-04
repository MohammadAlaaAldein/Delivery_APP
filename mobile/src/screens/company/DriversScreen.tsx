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
    Modal,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DriverCard, Loading, EmptyState, Card, Badge, Button } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { entitiesService, ordersService } from '../../services';
import { t } from '../../i18n';
import { CompanyStackParamList, Driver, Order, OrderStatus } from '../../types';
import { useOrdersStore } from '../../stores';

type NavigationProp = NativeStackNavigationProp<CompanyStackParamList, 'Drivers'>;

const DriversScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { orders, fetchCompanyOrders } = useOrdersStore();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null);

    const unassignedOrders = orders.filter(
        (o) => o.status === OrderStatus.ASSIGNED_TO_COMPANY && !o.driverId
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [driversRes] = await Promise.all([
                entitiesService.getDrivers(),
                fetchCompanyOrders(),
            ]);
            setDrivers(driversRes.data || []);
        } catch (err) {
            console.error('Failed to load drivers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleAssignDriver = (driver: Driver) => {
        if (unassignedOrders.length === 0) {
            Alert.alert('No Orders', 'There are no orders to assign');
            return;
        }
        setSelectedDriver(driver);
        setShowAssignModal(true);
    };

    const handleAssignOrder = async (order: Order) => {
        if (!selectedDriver) return;

        setAssigningOrder(order.id);
        try {
            await ordersService.assignDriver(order.id, selectedDriver.id);
            Alert.alert('Success', `Order assigned to ${selectedDriver.name}`);
            setShowAssignModal(false);
            setSelectedDriver(null);
            await loadData();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to assign order');
        } finally {
            setAssigningOrder(null);
        }
    };

    const renderDriver = ({ item }: { item: Driver }) => {
        const activeOrdersCount = orders.filter(
            (o) => o.driverId === item.id && ['assigned_to_driver', 'picked_up', 'in_transit'].includes(o.status)
        ).length;

        return (
            <Card style={styles.driverCard}>
                <View style={styles.driverHeader}>
                    <View style={styles.driverAvatar}>
                        <Text style={styles.driverInitial}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.driverInfo}>
                        <View style={styles.driverNameRow}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <Badge
                                label={item.isActive ? 'Online' : 'Offline'}
                                variant={item.isActive ? 'success' : 'secondary'}
                                size="sm"
                            />
                        </View>
                        <Text style={styles.driverPhone}>{item.phone}</Text>
                    </View>
                </View>

                <View style={styles.driverStats}>
                    <View style={styles.driverStat}>
                        <Ionicons name="car-outline" size={18} color={COLORS.gray500} />
                        <Text style={styles.statText}>{item.vehicleType || 'N/A'}</Text>
                    </View>
                    <View style={styles.driverStat}>
                        <Ionicons name="cube-outline" size={18} color={COLORS.gray500} />
                        <Text style={styles.statText}>{activeOrdersCount} Active</Text>
                    </View>
                    <View style={styles.driverStat}>
                        <Ionicons name="star-outline" size={18} color={COLORS.warning} />
                        <Text style={styles.statText}>{item.rating?.toFixed(1) || '4.5'}</Text>
                    </View>
                </View>

                <View style={styles.driverActions}>
                    <TouchableOpacity style={styles.callBtn}>
                        <Ionicons name="call-outline" size={20} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.messageBtn}>
                        <Ionicons name="chatbubble-outline" size={20} color={COLORS.info} />
                    </TouchableOpacity>
                    <Button
                        title="Assign Order"
                        onPress={() => handleAssignDriver(item)}
                        size="sm"
                        disabled={!item.isActive || unassignedOrders.length === 0}
                    />
                </View>
            </Card>
        );
    };

    const renderOrderToAssign = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderToAssign}
            onPress={() => handleAssignOrder(item)}
            disabled={assigningOrder !== null}
        >
            <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <Text style={styles.orderAddress} numberOfLines={1}>
                    {item.deliveryAddress}
                </Text>
            </View>
            {assigningOrder === item.id ? (
                <Loading size="small" />
            ) : (
                <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    if (isLoading) {
        return <Loading fullScreen message="Loading drivers..." />;
    }

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
                <Text style={styles.title}>{t('company.drivers')}</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.successSoft }]}>
                        <Ionicons name="people" size={18} color={COLORS.success} />
                    </View>
                    <View>
                        <Text style={styles.statValue}>{drivers.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.primarySoft }]}>
                        <Ionicons name="radio-button-on" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.statValue}>
                            {drivers.filter((d) => d.isActive).length}
                        </Text>
                        <Text style={styles.statLabel}>Online</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.warningSoft }]}>
                        <Ionicons name="cube" size={18} color={COLORS.warning} />
                    </View>
                    <View>
                        <Text style={styles.statValue}>{unassignedOrders.length}</Text>
                        <Text style={styles.statLabel}>To Assign</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={renderDriver}
                ListEmptyComponent={
                    <EmptyState
                        title="No Drivers"
                        description="No drivers registered yet"
                        icon="people-outline"
                    />
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Assign Order Modal */}
            <Modal
                visible={showAssignModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAssignModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Assign Order to {selectedDriver?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.gray900} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={unassignedOrders}
                            keyExtractor={(item) => item.id}
                            renderItem={renderOrderToAssign}
                            ListEmptyComponent={
                                <EmptyState
                                    title="No Orders"
                                    description="No orders available to assign"
                                    icon="cube-outline"
                                />
                            }
                            style={styles.ordersList}
                        />
                    </View>
                </View>
            </Modal>
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
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
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
    },
    listContent: {
        padding: SPACING.base,
        paddingBottom: SPACING.xl,
    },
    driverCard: {
        marginBottom: SPACING.md,
        padding: SPACING.base,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverInitial: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.white,
    },
    driverInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    driverNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    driverStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    driverStat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        marginLeft: SPACING.xs,
    },
    driverActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.successSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    messageBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.infoSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
        flex: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: RADIUS['2xl'],
        borderTopRightRadius: RADIUS['2xl'],
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.base,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    ordersList: {
        padding: SPACING.base,
    },
    orderToAssign: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    orderAddress: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
});

export default DriversScreen;

