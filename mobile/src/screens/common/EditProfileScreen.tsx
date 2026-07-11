// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput, Card } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants';
import { useAuthStore } from '../../stores';
import { entitiesService } from '../../services';
import { t } from '../../i18n';
import { UserRole, Shop, Company, Driver } from '../../types';

const CITIES = [
    'amman', 'irbid', 'zarqa', 'balqa', 'mafraq', 'jerash',
    'ajloun', 'madaba', 'karak', 'tafilah', 'maan', 'aqaba',
];

const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [showCityPicker, setShowCityPicker] = useState(false);

    // Common fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');

    // Shop-specific fields
    const [area, setArea] = useState('');
    const [street, setStreet] = useState('');
    const [building, setBuilding] = useState('');
    const [address, setAddress] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    // Company-specific fields
    const [website, setWebsite] = useState('');
    const [companyType, setCompanyType] = useState('');

    // Driver-specific fields
    const [nationalId, setNationalId] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleBrand, setVehicleBrand] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [plateNumber, setPlateNumber] = useState('');

    const loadProfile = useCallback(async () => {
        setIsFetching(true);
        try {
            switch (user?.role) {
                case UserRole.SHOP: {
                    const shop = await entitiesService.getMyShop();
                    setName(shop.name || '');
                    setPhone(shop.phone || '');
                    setEmail(shop.email || '');
                    setCity(shop.city || '');
                    setArea(shop.area || '');
                    setStreet(shop.street || '');
                    setBuilding(shop.building || '');
                    setAddress(shop.address || '');
                    setWhatsapp(shop.whatsapp || '');
                    setLicenseNumber(shop.license_number || '');
                    break;
                }
                case UserRole.COMPANY: {
                    const company = await entitiesService.getMyCompany();
                    setName(company.name || '');
                    setPhone(company.phone || '');
                    setEmail(company.email || '');
                    setCity(company.city || '');
                    setAddress(company.address || '');
                    setWebsite(company.website || '');
                    setCompanyType(company.company_type || '');
                    setLicenseNumber(company.license_number || '');
                    break;
                }
                case UserRole.DRIVER: {
                    const driver = await entitiesService.getMyDriverProfile();
                    setName(driver.name || driver.user?.name || '');
                    setPhone(driver.phone || '');
                    setEmail(driver.email || driver.user?.email || '');
                    setCity(driver.city || '');
                    setNationalId(driver.national_id || '');
                    setBirthDate(driver.birth_date || '');
                    setLicenseNumber(driver.license_number || '');
                    setVehicleType(driver.vehicle_type || '');
                    setVehicleBrand(driver.vehicle_brand || '');
                    setVehicleModel(driver.vehicle_model || '');
                    setVehicleYear(driver.vehicle_year?.toString() || '');
                    setVehicleColor(driver.vehicle_color || '');
                    setPlateNumber(driver.plate_number || '');
                    break;
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            Alert.alert(t('common.error'), error.response?.data?.message || t('errors.unknownError'));
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('common.error'), t('validation.required', { field: t('profile.name') || 'الاسم' }));
            return;
        }

        setIsLoading(true);
        try {
            switch (user?.role) {
                case UserRole.SHOP: {
                    const updateData: Partial<Shop> = {
                        name: name.trim(),
                        phone: phone.trim() || undefined,
                        email: email.trim() || undefined,
                        city: city || undefined,
                        area: area.trim() || undefined,
                        street: street.trim() || undefined,
                        building: building.trim() || undefined,
                        address: address.trim() || undefined,
                        whatsapp: whatsapp.trim() || undefined,
                        license_number: licenseNumber.trim() || undefined,
                    };
                    await entitiesService.updateMyShop(updateData);
                    break;
                }
                case UserRole.COMPANY: {
                    const updateData: Partial<Company> = {
                        name: name.trim(),
                        phone: phone.trim() || undefined,
                        email: email.trim() || undefined,
                        city: city || undefined,
                        address: address.trim() || undefined,
                        website: website.trim() || undefined,
                        company_type: companyType.trim() || undefined,
                        license_number: licenseNumber.trim() || undefined,
                    };
                    await entitiesService.updateMyCompany(updateData);
                    break;
                }
                case UserRole.DRIVER: {
                    const updateData: Partial<Driver> = {
                        phone: phone.trim() || undefined,
                        city: city || undefined,
                        national_id: nationalId.trim() || undefined,
                        birth_date: birthDate.trim() || undefined,
                        license_number: licenseNumber.trim() || undefined,
                        vehicle_type: vehicleType.trim() || undefined,
                        vehicle_brand: vehicleBrand.trim() || undefined,
                        vehicle_model: vehicleModel.trim() || undefined,
                        vehicle_year: vehicleYear ? parseInt(vehicleYear) : undefined,
                        vehicle_color: vehicleColor.trim() || undefined,
                        plate_number: plateNumber.trim() || undefined,
                    };
                    await entitiesService.updateMyDriverProfile(updateData);
                    break;
                }
            }

            // Update local user state
            updateUser({ name: name.trim() });

            Alert.alert(
                t('common.success'),
                t('profile.updateSuccess') || t('common.success'),
                [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('errors.unknownError')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const renderCityPicker = () => (
        <>
            <Text style={styles.fieldLabel}>{t('orders.deliveryCity') || 'المدينة'}</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCityPicker(!showCityPicker)}
            >
                <Text style={[styles.pickerButtonText, city && styles.pickerButtonTextSelected]}>
                    {city ? t(`cities.${city}`) : 'اختر المدينة'}
                </Text>
                <Ionicons name={showCityPicker ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.gray500} />
            </TouchableOpacity>
            {showCityPicker && (
                <View style={styles.pickerList}>
                    {CITIES.map((c) => (
                        <TouchableOpacity
                            key={c}
                            style={[styles.pickerOption, city === c && styles.pickerOptionActive]}
                            onPress={() => { setCity(c); setShowCityPicker(false); }}
                        >
                            <Text style={styles.pickerOptionText}>{t(`cities.${c}`)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    );

    if (isFetching) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" translucent backgroundColor="transparent" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('profile.editProfile')}</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.gray500 }}>{t('common.loading')}...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('profile.editProfile')}</Text>
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
                    {/* Basic Info */}
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>{t('profile.personalInfo') || 'المعلومات الأساسية'}</Text>
                        </View>

                        <TextInput
                            label={t('profile.name') || 'الاسم'}
                            placeholder={t('profile.name') || 'الاسم'}
                            value={name}
                            onChangeText={setName}
                            leftIcon="person-outline"
                            required
                        />

                        <TextInput
                            label={t('profile.phone') || 'الهاتف'}
                            placeholder={t('profile.phone') || 'الهاتف'}
                            value={phone}
                            onChangeText={setPhone}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            label={t('profile.email') || 'البريد الإلكتروني'}
                            placeholder={t('profile.email') || 'البريد الإلكتروني'}
                            value={email}
                            onChangeText={setEmail}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {renderCityPicker()}
                    </Card>

                    {/* Shop-specific fields */}
                    {user?.role === UserRole.SHOP && (
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.sectionTitle}>{t('profile.shopInfo') || 'معلومات المتجر'}</Text>
                            </View>

                            <TextInput
                                label={t('orders.deliveryArea') || 'المنطقة'}
                                placeholder={t('orders.deliveryArea') || 'المنطقة'}
                                value={area}
                                onChangeText={setArea}
                                leftIcon="map-outline"
                            />

                            <TextInput
                                label={t('orders.deliveryStreet') || 'الشارع'}
                                placeholder={t('orders.deliveryStreet') || 'الشارع'}
                                value={street}
                                onChangeText={setStreet}
                                leftIcon="navigate-outline"
                            />

                            <TextInput
                                label={t('orders.deliveryBuilding') || 'المبنى'}
                                placeholder={t('orders.deliveryBuilding') || 'المبنى'}
                                value={building}
                                onChangeText={setBuilding}
                                leftIcon="business-outline"
                            />

                            <TextInput
                                label={t('orders.deliveryAddress') || 'العنوان'}
                                placeholder={t('orders.deliveryAddress') || 'العنوان'}
                                value={address}
                                onChangeText={setAddress}
                                leftIcon="location-outline"
                                multiline
                            />

                            <TextInput
                                label={t('profile.whatsapp') || 'واتساب'}
                                placeholder={t('profile.whatsapp') || 'واتساب'}
                                value={whatsapp}
                                onChangeText={setWhatsapp}
                                leftIcon="logo-whatsapp"
                                keyboardType="phone-pad"
                            />

                            <TextInput
                                label={t('profile.licenseNumber') || 'رقم الترخيص'}
                                placeholder={t('profile.licenseNumber') || 'رقم الترخيص'}
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                leftIcon="document-text-outline"
                            />
                        </Card>
                    )}

                    {/* Company-specific fields */}
                    {user?.role === UserRole.COMPANY && (
                        <Card style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIcon}>
                                    <Ionicons name="business-outline" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.sectionTitle}>{t('profile.companyInfo') || 'معلومات الشركة'}</Text>
                            </View>

                            <TextInput
                                label={t('orders.deliveryAddress') || 'العنوان'}
                                placeholder={t('orders.deliveryAddress') || 'العنوان'}
                                value={address}
                                onChangeText={setAddress}
                                leftIcon="location-outline"
                                multiline
                            />

                            <TextInput
                                label={t('profile.website') || 'الموقع الإلكتروني'}
                                placeholder="https://..."
                                value={website}
                                onChangeText={setWebsite}
                                leftIcon="globe-outline"
                                keyboardType="url"
                                autoCapitalize="none"
                            />

                            <TextInput
                                label={t('profile.companyType') || 'نوع الشركة'}
                                placeholder={t('profile.companyType') || 'نوع الشركة'}
                                value={companyType}
                                onChangeText={setCompanyType}
                                leftIcon="briefcase-outline"
                            />

                            <TextInput
                                label={t('profile.licenseNumber') || 'رقم الترخيص'}
                                placeholder={t('profile.licenseNumber') || 'رقم الترخيص'}
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                leftIcon="document-text-outline"
                            />
                        </Card>
                    )}

                    {/* Driver-specific fields */}
                    {user?.role === UserRole.DRIVER && (
                        <>
                            <Card style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionIcon}>
                                        <Ionicons name="id-card-outline" size={20} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.sectionTitle}>{t('profile.driverInfo') || 'معلومات السائق'}</Text>
                                </View>

                                <TextInput
                                    label={t('profile.nationalId') || 'الرقم الوطني'}
                                    placeholder={t('profile.nationalId') || 'الرقم الوطني'}
                                    value={nationalId}
                                    onChangeText={setNationalId}
                                    leftIcon="card-outline"
                                />

                                <TextInput
                                    label={t('profile.birthDate') || 'تاريخ الميلاد'}
                                    placeholder="YYYY-MM-DD"
                                    value={birthDate}
                                    onChangeText={setBirthDate}
                                    leftIcon="calendar-outline"
                                />

                                <TextInput
                                    label={t('profile.licenseNumber') || 'رقم الرخصة'}
                                    placeholder={t('profile.licenseNumber') || 'رقم الرخصة'}
                                    value={licenseNumber}
                                    onChangeText={setLicenseNumber}
                                    leftIcon="document-text-outline"
                                />
                            </Card>

                            <Card style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionIcon}>
                                        <Ionicons name="car-outline" size={20} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.sectionTitle}>{t('profile.vehicleInfo') || 'معلومات المركبة'}</Text>
                                </View>

                                <TextInput
                                    label={t('profile.vehicleType') || 'نوع المركبة'}
                                    placeholder={t('profile.vehicleType') || 'نوع المركبة'}
                                    value={vehicleType}
                                    onChangeText={setVehicleType}
                                    leftIcon="car-sport-outline"
                                />

                                <TextInput
                                    label={t('profile.vehicleBrand') || 'ماركة المركبة'}
                                    placeholder={t('profile.vehicleBrand') || 'ماركة المركبة'}
                                    value={vehicleBrand}
                                    onChangeText={setVehicleBrand}
                                    leftIcon="car-outline"
                                />

                                <TextInput
                                    label={t('profile.vehicleModel') || 'موديل المركبة'}
                                    placeholder={t('profile.vehicleModel') || 'موديل المركبة'}
                                    value={vehicleModel}
                                    onChangeText={setVehicleModel}
                                    leftIcon="speedometer-outline"
                                />

                                <TextInput
                                    label={t('profile.vehicleYear') || 'سنة الصنع'}
                                    placeholder="2024"
                                    value={vehicleYear}
                                    onChangeText={setVehicleYear}
                                    leftIcon="calendar-outline"
                                    keyboardType="number-pad"
                                />

                                <TextInput
                                    label={t('profile.vehicleColor') || 'لون المركبة'}
                                    placeholder={t('profile.vehicleColor') || 'لون المركبة'}
                                    value={vehicleColor}
                                    onChangeText={setVehicleColor}
                                    leftIcon="color-palette-outline"
                                />

                                <TextInput
                                    label={t('profile.plateNumber') || 'رقم اللوحة'}
                                    placeholder={t('profile.plateNumber') || 'رقم اللوحة'}
                                    value={plateNumber}
                                    onChangeText={setPlateNumber}
                                    leftIcon="pricetag-outline"
                                />
                            </Card>
                        </>
                    )}

                    {/* Save Button */}
                    <Button
                        title={t('common.save') || 'حفظ'}
                        onPress={handleSave}
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
});

export default EditProfileScreen;
