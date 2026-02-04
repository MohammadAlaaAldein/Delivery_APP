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
import { ordersService } from '../../services';
import { t } from '../../i18n';
import { DriverStackParamList, Order, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList, 'OrderDetail'>;
type RouteProps = RouteProp<DriverStackParamList, 'OrderDetail'>;

const DriverOrderDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { orderId } = route.params;
    const { orders, fetchDriverOrders } = useOrdersStore();

    const [order, setOrder] = useState<Order | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const foundOrder = orders.find((o) => o.id === orderId);
        setOrder(foundOrder || null);
    }, [orderId, orders]);

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleNavigate = (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    };

    const handlePickup = async () => {
        if (!order) return;
        setActionLoading(true);
        try {
            await ordersService.pickupOrder(order.id);
            Alert.alert('Success', 'Order marked as picked up');
            fetchDriverOrders();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update order');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartDelivery = async () => {
        if (!order) return;
        setActionLoading(true);
        try {
            await ordersService.startDelivery(order.id);
            Alert.alert('Success', 'Delivery started');
            fetchDriverOrders();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to start delivery');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliver = async () => {
        if (!order) return;
        Alert.alert(
            'Confirm Delivery',
            'Has this order been delivered successfully?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await ordersService.deliverOrder(order.id);
                            Alert.alert('Success', 'Order delivered successfully!');
                            fetchDriverOrders();
                            navigation.goBack();
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to complete delivery');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (!order) {
        return <Loading fullScreen message="Loading order details..." />;
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG[OrderStatus.PENDING];

    const getActionButton = () => {
        switch (order.status) {
            case OrderStatus.ASSIGNED_TO_DRIVER:
                return (
                    <Button
                        title="Mark as Picked Up"
                        onPress={handlePickup}
                        loading={actionLoading}
                        fullWidth
                        icon="archive-outline"
                        variant="warning"
                    />
                );
            case OrderStatus.PICKED_UP:
                return (
                    <Button
                        title="Start Delivery"
                        onPress={handleStartDelivery}
                        loading={actionLoading}
                        fullWidth
                        icon="car-outline"
                    />
                );
            case OrderStatus.IN_TRANSIT:
                return (
                    <Button
                        title="Mark as Delivered"
                        onPress={handleDeliver}
                        loading={actionLoading}
                        fullWidth
                        icon="checkmark-circle-outline"
                        variant="success"
                    />
                );
            default:
                return null;
        }
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
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => handleCall(order.customerPhone)}
                    >
                        <Ionicons name="call" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                        <Text style={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: COLORS.white }]}>
                        <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
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
                {/* Route Card */}
                <Card style={styles.routeCard}>
                    <Text style={styles.routeTitle}>Delivery Route</Text>

                    {/* Pickup Point */}
                    <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: COLORS.primarySoft }]}>
                            <Ionicons name="storefront" size={16} color={COLORS.primary} />
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>PICKUP</Text>
                            <Text style={styles.routeName}>{order.shop?.name || 'Shop'}</Text>
                            <Text style={styles.routeAddress}>{order.shop?.address || 'Shop address'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.navigateBtn}
                            onPress={() => handleNavigate(order.shop?.address || '')}
                        >
                            <Ionicons name="navigate" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.routeLine}>
                        <View style={styles.lineSegment} />
                        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray300} />
                        <View style={styles.lineSegment} />
                    </View>

                    {/* Delivery Point */}
                    <View style={styles.routePoint}>
                        <View style={[styles.routeDot, { backgroundColor: COLORS.successSoft }]}>
                            <Ionicons name="location" size={16} color={COLORS.success} />
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>DELIVERY</Text>
                            <Text style={styles.routeName}>{order.customerName}</Text>
                            <Text style={styles.routeAddress}>{order.deliveryAddress}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.navigateBtn, { backgroundColor: COLORS.success }]}
                            onPress={() => handleNavigate(order.deliveryAddress)}
                        >
                            <Ionicons name="navigate" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Customer Contact */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Customer</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{order.customerName}</Text>
                            <Text style={styles.contactPhone}>{order.customerPhone}</Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity
                                style={styles.contactBtn}
                                onPress={() => handleCall(order.customerPhone)}
                            >
                                <Ionicons name="call" size={20} color={COLORS.success} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.contactBtn, { backgroundColor: COLORS.infoSoft }]}
                                onPress={() => Linking.openURL(`sms:${order.customerPhone}`)}
                            >
                                <Ionicons name="chatbubble" size={20} color={COLORS.info} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                {/* Order Items */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
                    </View>
                    {order.items?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Badge label={item.type} variant="secondary" size="sm" />
                            </View>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                        </View>
                    ))}
                </Card>

                {/* Payment Info */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Payment</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Method</Text>
                        <Badge label={order.paymentMethod || 'Cash'} variant="secondary" />
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Status</Text>
                        <Badge
                            label={order.paymentStatus || 'Pending'}
                            variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                        />
                    </View>
                    <Divider />
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Total Amount</Text>
                        <Text style={styles.paymentTotal}>${order.totalAmount?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Delivery Fee</Text>
                        <Text style={styles.deliveryFee}>${order.deliveryFee?.toFixed(2) || '0.00'}</Text>
                    </View>
                </Card>

                {/* Notes */}
                {order.notes && (
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Notes</Text>
                        </View>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </Card>
                )}

                {/* Action Button */}
                <View style={styles.actionContainer}>
                    {getActionButton()}
                </View>
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
    routeCard: {
        marginBottom: SPACING.md,
        padding: SPACING.base,
    },
    routeTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginBottom: SPACING.md,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    routeDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    routeLabel: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray400,
        letterSpacing: 1,
    },
    routeName: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginTop: 2,
    },
    routeAddress: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    navigateBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 18,
        height: 40,
    },
    lineSegment: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.border,
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
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contactInfo: {},
    contactName: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    contactPhone: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    contactActions: {
        flexDirection: 'row',
    },
    contactBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.successSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemName: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray800,
        marginRight: SPACING.sm,
    },
    itemQuantity: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray600,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    paymentLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    paymentTotal: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    deliveryFee: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.success,
    },
    notesText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        lineHeight: 20,
    },
    actionContainer: {
        marginTop: SPACING.md,
    },
});

export default DriverOrderDetailScreen;

