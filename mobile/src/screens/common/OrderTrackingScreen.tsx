// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ORDER_STATUS_CONFIG } from '../../constants';
import { useOrdersStore } from '../../stores';
import { socketService, SOCKET_EVENTS, ROOMS } from '../../services';
import { t } from '../../i18n';
import { Order, OrderStatus } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RouteProps = RouteProp<{ OrderTracking: { orderId: number } }, 'OrderTracking'>;

interface DriverLocation {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp?: number;
}

// Default center: Amman, Jordan
const DEFAULT_REGION = {
    latitude: 31.9539,
    longitude: 35.9106,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const OrderTrackingScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProps>();
    const { orderId } = route.params;
    const { orders } = useOrdersStore();
    const mapRef = useRef<MapView>(null);

    const [order, setOrder] = useState<Order | null>(null);
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    // Find order from store
    useEffect(() => {
        const foundOrder = orders.find((o) => String(o.id) === String(orderId));
        setOrder(foundOrder || null);

        // Initialize driver location from order data if available
        if (foundOrder?.driver) {
            const dLat = foundOrder.driver.current_latitude || foundOrder.driver.currentLatitude;
            const dLng = foundOrder.driver.current_longitude || foundOrder.driver.currentLongitude;
            if (dLat && dLng) {
                setDriverLocation({
                    latitude: Number(dLat),
                    longitude: Number(dLng),
                });
            }
        }
    }, [orderId, orders]);

    // Join order room and listen for driver location updates
    useEffect(() => {
        if (!orderId) return;

        // Join order-specific room for tracking
        socketService.joinRoom(ROOMS.ORDER(Number(orderId)));

        // Listen for driver location updates
        const handleLocationUpdate = (data: any) => {
            if (data && data.latitude && data.longitude) {
                setDriverLocation({
                    latitude: Number(data.latitude),
                    longitude: Number(data.longitude),
                    speed: data.speed,
                    heading: data.heading,
                    timestamp: data.timestamp,
                });
                setLastUpdate(new Date().toLocaleTimeString());
            }
        };

        socketService.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, handleLocationUpdate);

        return () => {
            socketService.off(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, handleLocationUpdate);
            socketService.leaveRoom(ROOMS.ORDER(Number(orderId)));
        };
    }, [orderId]);

    // Auto-fit map to show all markers when map is ready
    const fitMapToMarkers = useCallback(() => {
        if (!mapRef.current || !isMapReady) return;

        const coordinates: { latitude: number; longitude: number }[] = [];

        // Shop/pickup location
        const shopLat = order?.shop?.latitude;
        const shopLng = order?.shop?.longitude;
        if (shopLat && shopLng) {
            coordinates.push({ latitude: Number(shopLat), longitude: Number(shopLng) });
        }

        // Delivery location
        const delLat = order?.delivery_latitude || order?.deliveryLatitude;
        const delLng = order?.delivery_longitude || order?.deliveryLongitude;
        if (delLat && delLng) {
            coordinates.push({ latitude: Number(delLat), longitude: Number(delLng) });
        }

        // Driver location
        if (driverLocation) {
            coordinates.push({
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
            });
        }

        if (coordinates.length >= 2) {
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
                animated: true,
            });
        } else if (coordinates.length === 1) {
            mapRef.current.animateToRegion({
                ...coordinates[0],
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        }
    }, [order, driverLocation, isMapReady]);

    useEffect(() => {
        if (isMapReady) {
            setTimeout(fitMapToMarkers, 500);
        }
    }, [isMapReady, fitMapToMarkers]);

    const getStatusLabel = () => {
        if (!order) return '';
        const config = ORDER_STATUS_CONFIG[order.status];
        return config?.label || order.status;
    };

    const getStatusColor = () => {
        if (!order) return COLORS.primary;
        const config = ORDER_STATUS_CONFIG[order.status];
        return config?.color || COLORS.primary;
    };

    // Marker coordinates
    const shopCoord = order?.shop?.latitude && order?.shop?.longitude
        ? { latitude: Number(order.shop.latitude), longitude: Number(order.shop.longitude) }
        : null;

    const deliveryCoord = (order?.delivery_latitude || order?.deliveryLatitude) &&
        (order?.delivery_longitude || order?.deliveryLongitude)
        ? {
            latitude: Number(order?.delivery_latitude || order?.deliveryLatitude),
            longitude: Number(order?.delivery_longitude || order?.deliveryLongitude),
        }
        : null;

    const initialRegion = driverLocation
        ? { ...driverLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        : shopCoord
            ? { ...shopCoord, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : DEFAULT_REGION;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {t('orders.trackOrder', 'تتبع الطلب')}
                    </Text>
                    {order && (
                        <Text style={styles.orderNumber}>#{order.order_number}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.fitButton}
                    onPress={fitMapToMarkers}
                >
                    <Ionicons name="scan-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={initialRegion}
                    onMapReady={() => setIsMapReady(true)}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={true}
                    rotateEnabled={true}
                    pitchEnabled={false}
                >
                    {/* Shop / Pickup Marker */}
                    {shopCoord && (
                        <Marker
                            coordinate={shopCoord}
                            title={order?.shop?.name || t('orders.pickupPoint', 'نقطة الاستلام')}
                            description={order?.shop?.address || ''}
                            pinColor={COLORS.primary}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[styles.markerPin, { backgroundColor: COLORS.primary }]}>
                                    <Ionicons name="storefront" size={16} color={COLORS.white} />
                                </View>
                                <View style={[styles.markerArrow, { borderTopColor: COLORS.primary }]} />
                            </View>
                        </Marker>
                    )}

                    {/* Delivery Marker */}
                    {deliveryCoord && (
                        <Marker
                            coordinate={deliveryCoord}
                            title={t('orders.deliveryPoint', 'نقطة التوصيل')}
                            description={order?.delivery_address || ''}
                            pinColor={COLORS.success}
                        >
                            <View style={styles.markerContainer}>
                                <View style={[styles.markerPin, { backgroundColor: COLORS.success }]}>
                                    <Ionicons name="flag" size={16} color={COLORS.white} />
                                </View>
                                <View style={[styles.markerArrow, { borderTopColor: COLORS.success }]} />
                            </View>
                        </Marker>
                    )}

                    {/* Driver Marker (real-time) */}
                    {driverLocation && (
                        <Marker
                            coordinate={{
                                latitude: driverLocation.latitude,
                                longitude: driverLocation.longitude,
                            }}
                            title={order?.driver?.name || t('orders.driver', 'السائق')}
                            description={lastUpdate ? `${t('orders.lastUpdate', 'آخر تحديث')}: ${lastUpdate}` : ''}
                        >
                            <View style={styles.driverMarkerContainer}>
                                <View style={styles.driverMarkerPulse} />
                                <View style={styles.driverMarkerPin}>
                                    <Ionicons name="car-sport" size={18} color={COLORS.white} />
                                </View>
                            </View>
                        </Marker>
                    )}

                    {/* Route line from shop to delivery */}
                    {shopCoord && deliveryCoord && (
                        <Polyline
                            coordinates={[
                                shopCoord,
                                ...(driverLocation
                                    ? [{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }]
                                    : []),
                                deliveryCoord,
                            ]}
                            strokeColor={COLORS.primary}
                            strokeWidth={3}
                            lineDashPattern={[6, 4]}
                        />
                    )}
                </MapView>

                {/* Status Overlay */}
                <View style={styles.statusOverlay}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
                        {getStatusLabel()}
                    </Text>
                </View>
            </View>

            {/* Bottom Info Panel */}
            <View style={styles.infoPanel}>
                {/* Driver Info */}
                {order?.driver && (
                    <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                            <Ionicons name="person" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>{order.driver.name}</Text>
                            <Text style={styles.driverMeta}>
                                {order.driver.vehicle_type || order.driver.vehicleType || t('orders.driver', 'السائق')}
                                {driverLocation?.speed ? ` • ${(driverLocation.speed * 3.6).toFixed(0)} km/h` : ''}
                            </Text>
                        </View>
                        {lastUpdate && (
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>{t('orders.live', 'مباشر')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* No driver assigned yet */}
                {!order?.driver && (
                    <View style={styles.noDriverContainer}>
                        <Ionicons name="hourglass-outline" size={24} color={COLORS.gray400} />
                        <Text style={styles.noDriverText}>
                            {t('orders.waitingForDriver', 'بانتظار تعيين سائق')}
                        </Text>
                    </View>
                )}

                {/* No location yet */}
                {order?.driver && !driverLocation && (
                    <View style={styles.waitingLocation}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.waitingText}>
                            {t('orders.waitingForLocation', 'بانتظار موقع السائق...')}
                        </Text>
                    </View>
                )}

                {/* Delivery address */}
                {order?.delivery_address && (
                    <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={18} color={COLORS.gray500} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {order.delivery_address}
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...SHADOWS.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray800,
    },
    orderNumber: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    fitButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    // Custom markers
    markerContainer: {
        alignItems: 'center',
    },
    markerPin: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -2,
    },
    driverMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverMarkerPulse: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
    },
    driverMarkerPin: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
        ...SHADOWS.lg,
    },
    // Status overlay
    statusOverlay: {
        position: 'absolute',
        top: SPACING.md,
        left: SPACING.base,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        ...SHADOWS.md,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.xs,
    },
    statusLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.sm,
    },
    // Bottom info panel
    infoPanel: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        ...SHADOWS.lg,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    driverAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primaryLight || '#E8F0FE',
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
        color: COLORS.gray800,
    },
    driverMeta: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.success,
        marginRight: 4,
    },
    liveText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.xs,
        color: COLORS.success,
    },
    noDriverContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
    },
    noDriverText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
        marginLeft: SPACING.sm,
    },
    waitingLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xs,
    },
    waitingText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginLeft: SPACING.sm,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    addressText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: SPACING.sm,
        flex: 1,
    },
});

export default OrderTrackingScreen;
