// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, TextInput, Card, Badge } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants';
import { useOrdersStore } from '../../stores';
import { entitiesService } from '../../services';
import { t } from '../../i18n';
import { ShopStackParamList, OrderItemType, PaymentMethod, Company } from '../../types';

type NavigationProp = NativeStackNavigationProp<ShopStackParamList, 'CreateOrder'>;

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: OrderItemType;
    size?: string;
}

const CITIES = [
    'amman', 'irbid', 'zarqa', 'balqa', 'mafraq', 'jerash',
    'ajloun', 'madaba', 'karak', 'tafilah', 'maan', 'aqaba',
];

const CreateOrderScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { createOrder } = useOrdersStore();

    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [showCompanyPicker, setShowCompanyPicker] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerPhoneAlt, setCustomerPhoneAlt] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Delivery Address
    const [deliveryCity, setDeliveryCity] = useState('');
    const [deliveryArea, setDeliveryArea] = useState('');
    const [deliveryStreet, setDeliveryStreet] = useState('');
    const [deliveryBuilding, setDeliveryBuilding] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');

    // Order Items
    const [items, setItems] = useState<OrderItem[]>([
        { id: '1', name: '', quantity: 1, price: 0, type: OrderItemType.PACKAGE },
    ]);

    // Order Options
    const [requiresLargeVehicle, setRequiresLargeVehicle] = useState(false);
    const [priority, setPriority] = useState(0);
    const [scheduledPickupTime, setScheduledPickupTime] = useState('');

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [deliveryFee, setDeliveryFee] = useState('');

    // Notes
    const [shopNotes, setShopNotes] = useState('');

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await entitiesService.getCompanies();
            setCompanies(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error('Failed to load companies:', err);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!customerName.trim()) {
            newErrors.customerName = t('validation.required', { field: t('orders.customerName') });
        }
        if (!customerPhone.trim()) {
            newErrors.customerPhone = t('validation.required', { field: t('orders.customerPhone') });
        }

        const validItems = items.filter((item) => item.name.trim() || item.type);
        if (validItems.length === 0) {
            newErrors.items = t('validation.required', { field: t('orders.items') });
        }

        if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            newErrors.customerEmail = t('validation.email');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                id: Date.now().toString(),
                name: '',
                quantity: 1,
                price: 0,
                type: OrderItemType.PACKAGE,
            },
        ]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const handleUpdateItem = (id: string, field: keyof OrderItem, value: any) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const calculateTotal = () => {
        const itemsTotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const fee = parseFloat(deliveryFee) || 0;
        return itemsTotal + fee;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);

        try {
            const validItems = items
                .filter((item) => item.name.trim() || item.type)
                .map((item) => ({
                    type: item.type,
                    count: item.quantity,
                    description: item.name.trim() || undefined,
                    size: item.size || undefined,
                }));

            const orderData: any = {
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                order_items: validItems,
                payment_method: paymentMethod,
                order_amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
                delivery_fee: parseFloat(deliveryFee) || 0,
            };

            if (customerPhoneAlt.trim()) orderData.customer_phone_alt = customerPhoneAlt.trim();
            if (customerEmail.trim()) orderData.customer_email = customerEmail.trim();
            if (deliveryCity) orderData.delivery_city = deliveryCity;
            if (deliveryArea.trim()) orderData.delivery_area = deliveryArea.trim();
            if (deliveryStreet.trim()) orderData.delivery_street = deliveryStreet.trim();
            if (deliveryBuilding.trim()) orderData.delivery_building = deliveryBuilding.trim();
            if (deliveryAddress.trim()) orderData.delivery_address = deliveryAddress.trim();
            if (deliveryNotes.trim()) orderData.delivery_notes = deliveryNotes.trim();
            if (shopNotes.trim()) orderData.shop_notes = shopNotes.trim();
            if (selectedCompany) orderData.company_id = selectedCompany.id;
            if (requiresLargeVehicle) orderData.requires_large_vehicle = true;
            if (priority > 0) orderData.priority = priority;
            if (scheduledPickupTime.trim()) orderData.scheduled_pickup_time = scheduledPickupTime.trim();

            await createOrder(orderData);

            Alert.alert(
                t('common.success'),
                t('orders.createSuccess') || t('common.success'),
                [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert(
                t('common.error'),
                err.response?.data?.message || t('errors.unknownError')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const renderItemTypeButton = (
        item: OrderItem,
        type: OrderItemType,
        icon: string,
        label: string
    ) => (
        <TouchableOpacity
            key={type}
            style={[
                styles.itemTypeBtn,
                item.type === type && styles.itemTypeBtnActive,
            ]}
            onPress={() => handleUpdateItem(item.id, 'type', type)}
        >
            <Ionicons
                name={icon as any}
                size={16}
                color={item.type === type ? COLORS.primary : COLORS.gray500}
            />
            <Text
                style={[
                    styles.itemTypeText,
                    item.type === type && styles.itemTypeTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderPaymentMethod = (
        method: PaymentMethod,
        icon: string,
        label: string
    ) => (
        <TouchableOpacity
            key={method}
            style={[
                styles.paymentMethodBtn,
                paymentMethod === method && styles.paymentMethodBtnActive,
            ]}
            onPress={() => setPaymentMethod(method)}
        >
            <Ionicons
                name={icon as any}
                size={24}
                color={paymentMethod === method ? COLORS.primary : COLORS.gray500}
            />
            <Text
                style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.paymentMethodTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

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
                <Text style={styles.title}>{t('shop.createOrder')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Customer Information */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.customerInfo')}</Text>
                        </View>

                        <TextInput
                            label={t('orders.customerName')}
                            placeholder={t('orders.customerName')}
                            value={customerName}
                            onChangeText={setCustomerName}
                            error={errors.customerName}
                            leftIcon="person-outline"
                            required
                        />

                        <TextInput
                            label={t('orders.customerPhone')}
                            placeholder={t('orders.customerPhone')}
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            error={errors.customerPhone}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                            required
                        />

                        <TextInput
                            label={t('orders.customerPhoneAlt') || t('orders.customerPhone') + ' 2'}
                            placeholder={t('orders.customerPhoneAlt') || t('orders.customerPhone') + ' 2'}
                            value={customerPhoneAlt}
                            onChangeText={setCustomerPhoneAlt}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            label={t('orders.customerEmail') || t('auth.email')}
                            placeholder={t('orders.customerEmail') || t('auth.email')}
                            value={customerEmail}
                            onChangeText={setCustomerEmail}
                            error={errors.customerEmail}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </Card>

                    {/* Delivery Address */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.deliveryAddress')}</Text>
                        </View>

                        {/* City Picker */}
                        <Text style={styles.fieldLabel}>{t('orders.deliveryCity') || 'المدينة'}</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowCityPicker(!showCityPicker)}
                        >
                            <Text
                                style={[
                                    styles.pickerButtonText,
                                    deliveryCity && styles.pickerButtonTextSelected,
                                ]}
                            >
                                {deliveryCity ? t(`cities.${deliveryCity}`) : t('orders.selectCity') || 'اختر المدينة'}
                            </Text>
                            <Ionicons
                                name={showCityPicker ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={COLORS.gray500}
                            />
                        </TouchableOpacity>

                        {showCityPicker && (
                            <View style={styles.pickerList}>
                                <TouchableOpacity
                                    style={[styles.pickerOption, !deliveryCity && styles.pickerOptionActive]}
                                    onPress={() => { setDeliveryCity(''); setShowCityPicker(false); }}
                                >
                                    <Text style={styles.pickerOptionText}>—</Text>
                                </TouchableOpacity>
                                {CITIES.map((city) => (
                                    <TouchableOpacity
                                        key={city}
                                        style={[
                                            styles.pickerOption,
                                            deliveryCity === city && styles.pickerOptionActive,
                                        ]}
                                        onPress={() => { setDeliveryCity(city); setShowCityPicker(false); }}
                                    >
                                        <Text style={styles.pickerOptionText}>{t(`cities.${city}`)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <TextInput
                            label={t('orders.deliveryArea') || 'المنطقة'}
                            placeholder={t('orders.deliveryArea') || 'المنطقة'}
                            value={deliveryArea}
                            onChangeText={setDeliveryArea}
                            leftIcon="map-outline"
                        />

                        <TextInput
                            label={t('orders.deliveryStreet') || 'الشارع'}
                            placeholder={t('orders.deliveryStreet') || 'الشارع'}
                            value={deliveryStreet}
                            onChangeText={setDeliveryStreet}
                            leftIcon="navigate-outline"
                        />

                        <TextInput
                            label={t('orders.deliveryBuilding') || 'المبنى'}
                            placeholder={t('orders.deliveryBuilding') || 'المبنى'}
                            value={deliveryBuilding}
                            onChangeText={setDeliveryBuilding}
                            leftIcon="business-outline"
                        />

                        <TextInput
                            label={t('orders.deliveryAddress')}
                            placeholder={t('orders.deliveryAddress')}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            leftIcon="location-outline"
                            multiline
                            numberOfLines={2}
                        />

                        <TextInput
                            label={t('orders.deliveryNotes') || t('orders.notes')}
                            placeholder={t('orders.deliveryNotes') || t('orders.notes')}
                            value={deliveryNotes}
                            onChangeText={setDeliveryNotes}
                            leftIcon="chatbox-outline"
                            multiline
                            numberOfLines={2}
                        />
                    </Card>

                    {/* Order Items */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.items')}</Text>
                        </View>

                        {errors.items && (
                            <Text style={styles.errorText}>{errors.items}</Text>
                        )}

                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <Badge label={`${t('orders.items')} ${index + 1}`} variant="secondary" size="sm" />
                                    {items.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(item.id)}
                                            style={styles.removeItemBtn}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    label={t('orders.description')}
                                    placeholder={t('orders.description')}
                                    value={item.name}
                                    onChangeText={(value) => handleUpdateItem(item.id, 'name', value)}
                                />

                                <View style={styles.itemTypeContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {renderItemTypeButton(item, OrderItemType.ENVELOPE, 'mail-outline', 'ظرف')}
                                        {renderItemTypeButton(item, OrderItemType.BAG, 'bag-outline', 'كيس')}
                                        {renderItemTypeButton(item, OrderItemType.SMALL_BOX, 'cube-outline', 'صغير')}
                                        {renderItemTypeButton(item, OrderItemType.MEDIUM_BOX, 'cube', 'متوسط')}
                                        {renderItemTypeButton(item, OrderItemType.LARGE_BOX, 'cube', 'كبير')}
                                        {renderItemTypeButton(item, OrderItemType.CUSTOM, 'ellipsis-horizontal', 'مخصص')}
                                    </ScrollView>
                                </View>

                                <View style={styles.itemRow}>
                                    <View style={{ flex: 1, marginRight: SPACING.md }}>
                                        <TextInput
                                            label={t('orders.quantity') || 'الكمية'}
                                            placeholder="1"
                                            value={item.quantity.toString()}
                                            onChangeText={(value) =>
                                                handleUpdateItem(item.id, 'quantity', parseInt(value) || 1)
                                            }
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            label={t('orders.price') || 'السعر'}
                                            placeholder="0.00"
                                            value={item.price > 0 ? item.price.toString() : ''}
                                            onChangeText={(value) =>
                                                handleUpdateItem(item.id, 'price', parseFloat(value) || 0)
                                            }
                                            keyboardType="decimal-pad"
                                            leftIcon="cash-outline"
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.addItemText}>{t('orders.addItem') || 'إضافة عنصر'}</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Delivery Company */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.deliveryCompany') || 'شركة التوصيل'}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowCompanyPicker(!showCompanyPicker)}
                        >
                            <Text
                                style={[
                                    styles.pickerButtonText,
                                    selectedCompany && styles.pickerButtonTextSelected,
                                ]}
                            >
                                {selectedCompany?.name || t('orders.selectCompany') || 'اختيار شركة التوصيل'}
                            </Text>
                            <Ionicons
                                name={showCompanyPicker ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={COLORS.gray500}
                            />
                        </TouchableOpacity>

                        {showCompanyPicker && (
                            <View style={styles.pickerList}>
                                <TouchableOpacity
                                    style={[
                                        styles.pickerOption,
                                        !selectedCompany && styles.pickerOptionActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedCompany(null);
                                        setShowCompanyPicker(false);
                                    }}
                                >
                                    <Text style={styles.pickerOptionText}>
                                        {t('orders.autoAssign') || 'تعيين تلقائي'}
                                    </Text>
                                </TouchableOpacity>
                                {companies.map((company) => (
                                    <TouchableOpacity
                                        key={company.id}
                                        style={[
                                            styles.pickerOption,
                                            selectedCompany?.id === company.id && styles.pickerOptionActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedCompany(company);
                                            setShowCompanyPicker(false);
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{company.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </Card>

                    {/* Order Options */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="options-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.orderOptions') || 'خيارات الطلب'}</Text>
                        </View>

                        {/* Priority */}
                        <Text style={styles.fieldLabel}>{t('orders.priority')}</Text>
                        <View style={styles.priorityContainer}>
                            <TouchableOpacity
                                style={[styles.priorityBtn, priority === 0 && styles.priorityBtnActive]}
                                onPress={() => setPriority(0)}
                            >
                                <Ionicons name="remove-circle-outline" size={18} color={priority === 0 ? COLORS.primary : COLORS.gray500} />
                                <Text style={[styles.priorityText, priority === 0 && styles.priorityTextActive]}>عادي</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.priorityBtn, priority === 1 && styles.priorityBtnActive]}
                                onPress={() => setPriority(1)}
                            >
                                <Ionicons name="arrow-up-circle-outline" size={18} color={priority === 1 ? COLORS.primary : COLORS.gray500} />
                                <Text style={[styles.priorityText, priority === 1 && styles.priorityTextActive]}>عالي</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.priorityBtn, priority === 2 && styles.priorityBtnUrgent]}
                                onPress={() => setPriority(2)}
                            >
                                <Ionicons name="alert-circle-outline" size={18} color={priority === 2 ? COLORS.error : COLORS.gray500} />
                                <Text style={[styles.priorityText, priority === 2 && { color: COLORS.error }]}>عاجل</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Requires Large Vehicle */}
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>{t('orders.requiresLargeVehicle') || 'يتطلب مركبة كبيرة'}</Text>
                                <Text style={styles.switchDescription}>{t('orders.requiresLargeVehicleDesc') || 'للطلبات الكبيرة الحجم'}</Text>
                            </View>
                            <Switch
                                value={requiresLargeVehicle}
                                onValueChange={setRequiresLargeVehicle}
                                trackColor={{ false: COLORS.gray300, true: COLORS.primarySoft }}
                                thumbColor={requiresLargeVehicle ? COLORS.primary : COLORS.gray100}
                            />
                        </View>

                        {/* Scheduled Pickup */}
                        <TextInput
                            label={t('orders.scheduledPickup') || 'موعد الاستلام المجدول'}
                            placeholder="YYYY-MM-DD HH:mm"
                            value={scheduledPickupTime}
                            onChangeText={setScheduledPickupTime}
                            leftIcon="time-outline"
                        />
                    </Card>

                    {/* Payment */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.payment')}</Text>
                        </View>

                        <Text style={styles.fieldLabel}>{t('orders.paymentMethod')}</Text>
                        <View style={styles.paymentMethods}>
                            {renderPaymentMethod(PaymentMethod.CASH, 'cash-outline', t('orders.cash') || 'نقدي')}
                            {renderPaymentMethod(PaymentMethod.CARD, 'card-outline', t('orders.card') || 'بطاقة')}
                            {renderPaymentMethod(PaymentMethod.ONLINE, 'globe-outline', t('orders.online') || 'أونلاين')}
                        </View>

                        <TextInput
                            label={t('orders.deliveryFee')}
                            placeholder="0.00"
                            value={deliveryFee}
                            onChangeText={setDeliveryFee}
                            keyboardType="decimal-pad"
                            leftIcon="car-outline"
                        />
                    </Card>

                    {/* Shop Notes */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="chatbox-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('orders.notes')}</Text>
                        </View>

                        <TextInput
                            placeholder={t('orders.addNotes') || t('orders.notes')}
                            value={shopNotes}
                            onChangeText={setShopNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </Card>

                    {/* Order Summary */}
                    <Card style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>{t('orders.summary')}</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('orders.orderAmount')}</Text>
                            <Text style={styles.summaryValue}>
                                {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} {t('common.currency') || 'د.أ'}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('orders.deliveryFee')}</Text>
                            <Text style={styles.summaryValue}>
                                {(parseFloat(deliveryFee) || 0).toFixed(2)} {t('common.currency') || 'د.أ'}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>{t('orders.totalAmount')}</Text>
                            <Text style={styles.totalValue}>{calculateTotal().toFixed(2)} {t('common.currency') || 'د.أ'}</Text>
                        </View>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        title={t('orders.createOrder') || t('shop.createOrder')}
                        onPress={handleSubmit}
                        loading={isLoading}
                        fullWidth
                        icon="checkmark-circle-outline"
                        style={{ marginTop: SPACING.md }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
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
    scrollContent: {
        padding: SPACING.base,
        paddingBottom: SPACING['2xl'],
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
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    fieldLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        marginBottom: SPACING.sm,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.error,
        marginBottom: SPACING.sm,
    },
    itemCard: {
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    removeItemBtn: {
        padding: SPACING.xs,
    },
    itemTypeContainer: {
        marginBottom: SPACING.md,
    },
    itemTypeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginRight: SPACING.xs,
        borderRadius: RADIUS.base,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemTypeBtnActive: {
        backgroundColor: COLORS.primarySoft,
        borderColor: COLORS.primary,
    },
    itemTypeText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginLeft: 4,
    },
    itemTypeTextActive: {
        color: COLORS.primary,
    },
    itemRow: {
        flexDirection: 'row',
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.base,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    addItemText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    pickerButtonText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray400,
    },
    pickerButtonTextSelected: {
        color: COLORS.gray900,
    },
    pickerList: {
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        maxHeight: 250,
    },
    pickerOption: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    pickerOptionActive: {
        backgroundColor: COLORS.primarySoft,
    },
    pickerOptionText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    paymentMethods: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    paymentMethodBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        marginRight: SPACING.sm,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentMethodBtnActive: {
        backgroundColor: COLORS.primarySoft,
        borderColor: COLORS.primary,
    },
    paymentMethodText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: SPACING.xs,
    },
    paymentMethodTextActive: {
        color: COLORS.primary,
    },
    priorityContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    priorityBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        marginRight: SPACING.sm,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    priorityBtnActive: {
        backgroundColor: COLORS.primarySoft,
        borderColor: COLORS.primary,
    },
    priorityBtnUrgent: {
        backgroundColor: '#FEE2E2',
        borderColor: COLORS.error,
    },
    priorityText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginLeft: SPACING.xs,
    },
    priorityTextActive: {
        color: COLORS.primary,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    switchLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    switchDescription: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    summaryCard: {
        padding: SPACING.base,
        backgroundColor: COLORS.gray900,
        marginTop: SPACING.md,
    },
    summaryTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    summaryLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
    },
    summaryValue: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray300,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: COLORS.gray700,
        marginVertical: SPACING.sm,
    },
    totalLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.white,
    },
    totalValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.success,
    },
});

export default CreateOrderScreen;

