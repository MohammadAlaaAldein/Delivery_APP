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
    TextInput as RNTextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrderCard, Loading, EmptyState, Badge } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useOrdersStore } from '../../stores';
import { t } from '../../i18n';
import { ShopStackParamList, OrderStatus, Order } from '../../types';

type NavigationProp = NativeStackNavigationProp<ShopStackParamList, 'Orders'>;

const TABS = [
    { key: 'all', label: 'All' },
    { key: OrderStatus.PENDING, label: 'Pending' },
    { key: OrderStatus.ASSIGNED_TO_COMPANY, label: 'Assigned' },
    { key: OrderStatus.PICKED_UP, label: 'Picked Up' },
    { key: OrderStatus.IN_TRANSIT, label: 'In Transit' },
    { key: OrderStatus.DELIVERED, label: 'Delivered' },
    { key: OrderStatus.CANCELLED, label: 'Cancelled' },
];

const ShopOrdersScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { orders, isLoading, fetchOrders } = useOrdersStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, []);

    const filteredOrders = orders.filter((order) => {
        // Filter by status
        if (activeTab !== 'all' && order.status !== activeTab) {
            return false;
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                order.orderNumber?.toLowerCase().includes(query) ||
                order.customerName?.toLowerCase().includes(query) ||
                order.customerPhone?.includes(query) ||
                order.deliveryAddress?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const handleOrderPress = (orderId: string) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    const handleCreateOrder = () => {
        navigation.navigate('CreateOrder');
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <OrderCard
            order={item}
            onPress={() => handleOrderPress(item.id)}
        />
    );

    const renderHeader = () => (
        <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color={COLORS.gray400} />
                    <RNTextInput
                        style={styles.searchInput}
                        placeholder="Search orders..."
                        placeholderTextColor={COLORS.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <FlatList
                    horizontal
                    data={TABS}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === item.key && styles.tabActive,
                            ]}
                            onPress={() => setActiveTab(item.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === item.key && styles.tabTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                            {activeTab === item.key && (
                                <Badge
                                    label={filteredOrders.length.toString()}
                                    variant="primary"
                                    size="sm"
                                />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Results count */}
            <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                </Text>
                <TouchableOpacity style={styles.sortBtn}>
                    <Ionicons name="filter-outline" size={18} color={COLORS.gray600} />
                    <Text style={styles.sortText}>Filter</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('shop.orders')}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleCreateOrder}>
                    <Ionicons name="add" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {isLoading && orders.length === 0 ? (
                <Loading fullScreen message="Loading orders..." />
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrder}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        <EmptyState
                            title={t('shop.noOrders')}
                            description={
                                searchQuery
                                    ? 'No orders match your search'
                                    : 'You haven\'t created any orders yet'
                            }
                            icon="cube-outline"
                            actionLabel="Create Order"
                            onAction={handleCreateOrder}
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
    title: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    searchContainer: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
        marginLeft: SPACING.sm,
        height: '100%',
    },
    tabsWrapper: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tabsContainer: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        marginRight: SPACING.sm,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.gray100,
    },
    tabActive: {
        backgroundColor: COLORS.primarySoft,
    },
    tabText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginRight: SPACING.xs,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
    },
    resultsText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.base,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sortText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: SPACING.xs,
    },
    listContent: {
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.xl,
    },
});

export default ShopOrdersScreen;

