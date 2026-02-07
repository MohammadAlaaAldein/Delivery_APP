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
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderCard, Loading, EmptyState, Button, Card } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useOrdersStore } from '../../stores';
import { ordersService } from '../../services';
import { t } from '../../i18n';
import { CompanyStackParamList, Order, OrderStatus } from '../../types';

type NavigationProp = NativeStackNavigationProp<CompanyStackParamList, 'AvailableOrders'>;

const AvailableOrdersScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { orders, isLoading, fetchAvailableOrders } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

    const availableOrders = orders.filter((o) => o.status === OrderStatus.PENDING);

    useEffect(() => {
        fetchAvailableOrders();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAvailableOrders();
        setRefreshing(false);
    }, []);

    const handleAcceptOrder = async (order: Order) => {
        Alert.alert(
            'Accept Order',
            `Accept order #${order.order_number}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        setAcceptingOrder(order.id);
                        try {
                            await ordersService.takeOrder(order.id);
                            Alert.alert('Success', 'Order accepted successfully!');
                            fetchAvailableOrders();
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to accept order');
                        } finally {
                            setAcceptingOrder(null);
                        }
                    },
                },
            ]
        );
    };

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderNumber}>#{item.order_number}</Text>
                    <Text style={styles.orderTime}>
                        {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                </View>
                <View style={styles.shopBadge}>
                    <Ionicons name="storefront-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.shopName}>{item.shop?.name || 'Shop'}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText}>{item.customer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText} numberOfLines={2}>
                        {item.delivery_address}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="cube-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.detailText}>
                        {item.order_items?.length || 0} item(s) • {item.order_items?.[0]?.type || 'Package'}
                    </Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Delivery Fee</Text>
                    <Text style={styles.priceValue}>${Number(item.delivery_fee || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => handleOrderPress(item.id)}
                    >
                        <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Button
                        title="Accept"
                        onPress={() => handleAcceptOrder(item)}
                        loading={acceptingOrder === item.id}
                        size="sm"
                        icon="checkmark-outline"
                    />
                </View>
            </View>
        </Card>
    );

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
                <Text style={styles.title}>{t('company.availableOrders')}</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter-outline" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{availableOrders.length}</Text>
                    <Text style={styles.summaryLabel}>Available</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        ${availableOrders.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0).toFixed(0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                </View>
            </View>

            {isLoading && availableOrders.length === 0 ? (
                <Loading fullScreen message="Loading available orders..." />
            ) : (
                <FlatList
                    data={availableOrders}
                        keyExtractor={(item) => String(item.id)}
                    renderItem={renderOrder}
                    ListEmptyComponent={
                        <EmptyState
                            title={t('company.noAvailableOrders')}
                            description="Check back later for new orders"
                            icon="cube-outline"
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
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.sm,
    },
    summaryItem: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    summaryValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.primary,
    },
    summaryLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
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
    shopBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primarySoft,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    shopName: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        color: COLORS.primary,
        marginLeft: 4,
    },
    orderDetails: {
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    detailText: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        marginLeft: SPACING.sm,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {},
    priceLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
    },
    priceValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.success,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
});

export default AvailableOrdersScreen;

