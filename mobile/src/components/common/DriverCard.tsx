import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Driver } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Badge } from './Card';

interface DriverCardProps {
    driver: Driver;
    onPress?: () => void;
    onAssign?: () => void;
    showAssignButton?: boolean;
    isSelected?: boolean;
    compact?: boolean;
}

const DriverCard: React.FC<DriverCardProps> = ({
    driver,
    onPress,
    onAssign,
    showAssignButton = false,
    isSelected = false,
    compact = false,
}) => {
    const getVehicleIcon = () => {
        switch (driver.vehicle_type) {
            case 'motorcycle':
                return 'bicycle';
            case 'car':
                return 'car';
            case 'van':
                return 'bus';
            case 'pickup':
                return 'car-sport';
            case 'truck':
                return 'train';
            default:
                return 'car';
        }
    };

    if (compact) {
        return (
            <TouchableOpacity
                onPress={onPress || onAssign}
                activeOpacity={0.7}
                style={[
                    styles.compactCard,
                    isSelected && styles.selectedCard,
                    SHADOWS.sm,
                ]}
            >
                <View style={styles.compactAvatar}>
                    {driver.personal_image ? (
                        <Image source={{ uri: driver.personal_image }} style={styles.avatarImage} />
                    ) : (
                        <Ionicons name="person" size={20} color={COLORS.gray400} />
                    )}
                </View>
                <View style={styles.compactInfo}>
                    <Text style={styles.compactName}>{driver.user?.name || driver.name || 'Driver'}</Text>
                    <View style={styles.compactMeta}>
                        <Ionicons name={getVehicleIcon()} size={12} color={COLORS.gray500} />
                        <Text style={styles.compactVehicle}>
                            {driver.vehicle_brand} {driver.vehicle_model}
                        </Text>
                    </View>
                </View>
                <View style={styles.compactRight}>
                    {driver.is_active ? (
                        <View style={styles.activeIndicator} />
                    ) : (
                        <View style={styles.inactiveIndicator} />
                    )}
                    {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={[styles.card, SHADOWS.base]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {driver.personal_image ? (
                        <Image source={{ uri: driver.personal_image }} style={styles.avatarImageLarge} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={32} color={COLORS.gray400} />
                        </View>
                    )}
                    <View style={[styles.statusIndicator, driver.is_active ? styles.online : styles.offline]} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name}>{driver.user?.name || driver.name || 'Driver'}</Text>
                    <Text style={styles.email}>{driver.user?.email || driver.email}</Text>
                    <Badge
                        text={driver.is_active ? 'Active' : 'Inactive'}
                        variant={driver.is_active ? 'success' : 'gray'}
                        size="sm"
                    />
                </View>
            </View>

            {/* Contact Info */}
            <View style={styles.section}>
                <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.infoText}>{driver.phone || 'No phone'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.gray500} />
                    <Text style={styles.infoText}>{driver.city || 'No city'}</Text>
                </View>
            </View>

            {/* Vehicle Info */}
            <View style={styles.vehicleSection}>
                <View style={styles.vehicleIconContainer}>
                    <Ionicons name={getVehicleIcon()} size={24} color={COLORS.primary} />
                </View>
                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleType}>
                        {driver.vehicle_brand} {driver.vehicle_model}
                    </Text>
                    <Text style={styles.vehicleDetails}>
                        {driver.vehicle_year} • {driver.vehicle_color} • {driver.plate_number}
                    </Text>
                </View>
            </View>

            {/* License Info */}
            <View style={styles.licenseSection}>
                <View style={styles.licenseItem}>
                    <Text style={styles.licenseLabel}>License #</Text>
                    <Text style={styles.licenseValue}>{driver.license_number || 'N/A'}</Text>
                </View>
                <View style={styles.licenseItem}>
                    <Text style={styles.licenseLabel}>Expires</Text>
                    <Text style={styles.licenseValue}>
                        {driver.license_expiry_date
                            ? new Date(driver.license_expiry_date).toLocaleDateString()
                            : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            {showAssignButton && (
                <TouchableOpacity
                    onPress={onAssign}
                    style={styles.assignButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                    <Text style={styles.assignButtonText}>Assign to Order</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.base,
        marginBottom: SPACING.md,
    },
    compactCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.base,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatarImageLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    online: {
        backgroundColor: COLORS.success,
    },
    offline: {
        backgroundColor: COLORS.gray400,
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    email: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginBottom: SPACING.xs,
    },
    section: {
        marginBottom: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    infoText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginLeft: SPACING.sm,
    },
    vehicleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primarySoft,
        borderRadius: RADIUS.base,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    vehicleIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleType: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    vehicleDetails: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray600,
        marginTop: 2,
    },
    licenseSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    licenseItem: {},
    licenseLabel: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
    },
    licenseValue: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray800,
        marginTop: 2,
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.base,
        paddingVertical: SPACING.sm,
        marginTop: SPACING.md,
    },
    assignButtonText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.white,
        marginLeft: SPACING.xs,
    },
    compactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    compactInfo: {
        flex: 1,
    },
    compactName: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray900,
    },
    compactMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    compactVehicle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginLeft: 4,
    },
    compactRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
        marginRight: SPACING.sm,
    },
    inactiveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gray400,
        marginRight: SPACING.sm,
    },
});

export default DriverCard;
