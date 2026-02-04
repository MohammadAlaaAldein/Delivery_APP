// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, TextInput, Card, Badge } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useOrdersStore } from '../../stores';
import { ordersService, entitiesService } from '../../services';
import { t } from '../../i18n';
import { ShopStackParamList, OrderItemType, PaymentMethod, Company } from '../../types';

type NavigationProp = NativeStackNavigationProp<ShopStackParamList, 'CreateOrder'>;

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    type: OrderItemType;
}

const CreateOrderScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { createOrder } = useOrdersStore();

    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [showCompanyPicker, setShowCompanyPicker] = useState(false);

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');

    // Order Items
    const [items, setItems] = useState<OrderItem[]>([
        { id: '1', name: '', quantity: 1, price: 0, type: OrderItemType.DOCUMENT },
    ]);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [deliveryFee, setDeliveryFee] = useState('');

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const response = await entitiesService.getCompanies();
            setCompanies(response.data || []);
        } catch (err) {
            console.error('Failed to load companies:', err);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!customerName.trim()) {
            newErrors.customerName = t('validation.required', { field: 'Customer name' });
        }
        if (!customerPhone.trim()) {
            newErrors.customerPhone = t('validation.required', { field: 'Phone' });
        }
        if (!deliveryAddress.trim()) {
            newErrors.deliveryAddress = t('validation.required', { field: 'Address' });
        }

        // Validate items
        const validItems = items.filter((item) => item.name.trim());
        if (validItems.length === 0) {
            newErrors.items = 'At least one item is required';
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
        if (!validate()) {
            return;
        }

        setIsLoading(true);

        try {
            const validItems = items
                .filter((item) => item.name.trim())
                .map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    type: item.type,
                }));

            await createOrder({
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                deliveryAddress: deliveryAddress.trim(),
                notes: notes.trim(),
                items: validItems,
                paymentMethod,
                deliveryFee: parseFloat(deliveryFee) || 0,
                companyId: selectedCompany?.id,
            });

            Alert.alert(
                t('common.success'),
                'Order created successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
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
            <StatusBar style="dark" />

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
                            <Text style={styles.sectionTitle}>Customer Information</Text>
                        </View>

                        <TextInput
                            label="Customer Name"
                            placeholder="Enter customer name"
                            value={customerName}
                            onChangeText={setCustomerName}
                            error={errors.customerName}
                            leftIcon="person-outline"
                            required
                        />

                        <TextInput
                            label="Phone Number"
                            placeholder="Enter phone number"
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            error={errors.customerPhone}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                            required
                        />

                        <TextInput
                            label="Delivery Address"
                            placeholder="Enter full delivery address"
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            error={errors.deliveryAddress}
                            leftIcon="location-outline"
                            multiline
                            numberOfLines={3}
                            required
                        />
                    </Card>

                    {/* Order Items */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Order Items</Text>
                        </View>

                        {errors.items && (
                            <Text style={styles.errorText}>{errors.items}</Text>
                        )}

                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <Badge label={`Item ${index + 1}`} variant="secondary" size="sm" />
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
                                    label="Item Name"
                                    placeholder="Enter item name"
                                    value={item.name}
                                    onChangeText={(value) => handleUpdateItem(item.id, 'name', value)}
                                />

                                <View style={styles.itemTypeContainer}>
                                    {renderItemTypeButton(item, OrderItemType.DOCUMENT, 'document-outline', 'Document')}
                                    {renderItemTypeButton(item, OrderItemType.PACKAGE, 'cube-outline', 'Package')}
                                    {renderItemTypeButton(item, OrderItemType.FOOD, 'fast-food-outline', 'Food')}
                                    {renderItemTypeButton(item, OrderItemType.OTHER, 'ellipsis-horizontal', 'Other')}
                                </View>

                                <View style={styles.itemRow}>
                                    <View style={{ flex: 1, marginRight: SPACING.md }}>
                                        <TextInput
                                            label="Quantity"
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
                                            label="Price"
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
                            <Text style={styles.addItemText}>Add Another Item</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Delivery Company (Optional) */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Delivery Company (Optional)</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.companyPicker}
                            onPress={() => setShowCompanyPicker(!showCompanyPicker)}
                        >
                            <Text
                                style={[
                                    styles.companyPickerText,
                                    selectedCompany && styles.companyPickerTextSelected,
                                ]}
                            >
                                {selectedCompany?.name || 'Select a delivery company'}
                            </Text>
                            <Ionicons
                                name={showCompanyPicker ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={COLORS.gray500}
                            />
                        </TouchableOpacity>

                        {showCompanyPicker && (
                            <View style={styles.companyList}>
                                <TouchableOpacity
                                    style={[
                                        styles.companyOption,
                                        !selectedCompany && styles.companyOptionActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedCompany(null);
                                        setShowCompanyPicker(false);
                                    }}
                                >
                                    <Text style={styles.companyOptionText}>
                                        Auto-assign (any company)
                                    </Text>
                                </TouchableOpacity>
                                {companies.map((company) => (
                                    <TouchableOpacity
                                        key={company.id}
                                        style={[
                                            styles.companyOption,
                                            selectedCompany?.id === company.id && styles.companyOptionActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedCompany(company);
                                            setShowCompanyPicker(false);
                                        }}
                                    >
                                        <Text style={styles.companyOptionText}>{company.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </Card>

                    {/* Payment */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Payment</Text>
                        </View>

                        <Text style={styles.fieldLabel}>Payment Method</Text>
                        <View style={styles.paymentMethods}>
                            {renderPaymentMethod(PaymentMethod.CASH, 'cash-outline', 'Cash')}
                            {renderPaymentMethod(PaymentMethod.CARD, 'card-outline', 'Card')}
                            {renderPaymentMethod(PaymentMethod.ONLINE, 'globe-outline', 'Online')}
                        </View>

                        <TextInput
                            label="Delivery Fee"
                            placeholder="0.00"
                            value={deliveryFee}
                            onChangeText={setDeliveryFee}
                            keyboardType="decimal-pad"
                            leftIcon="car-outline"
                        />
                    </Card>

                    {/* Notes */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="chatbox-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Additional Notes</Text>
                        </View>

                        <TextInput
                            placeholder="Add any special instructions..."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </Card>

                    {/* Order Summary */}
                    <Card style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Items Total</Text>
                            <Text style={styles.summaryValue}>
                                ${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={styles.summaryValue}>
                                ${(parseFloat(deliveryFee) || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
                        </View>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        title="Create Order"
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
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    itemTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
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
    fieldLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
        marginBottom: SPACING.sm,
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
    companyPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    companyPickerText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray400,
    },
    companyPickerTextSelected: {
        color: COLORS.gray900,
    },
    companyList: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    companyOption: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    companyOptionActive: {
        backgroundColor: COLORS.primarySoft,
    },
    companyOptionText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
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

