// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Card } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { useAuthStore } from '../../stores';
import { getCurrentLanguage, setLanguage, t } from '../../i18n';
import { UserRole } from '../../types';
import { DevSettings, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuthStore();
    const [loggingOut, setLoggingOut] = useState(false);
    const [language, setLanguageState] = useState(getCurrentLanguage());

    const handleChangeLanguage = useCallback(async () => {
        Alert.alert(
            t('settings.language'),
            '',
            [
                {
                    text: t('common.english') || 'English',
                    onPress: async () => {
                        await setLanguage('en');
                        setLanguageState('en');

                        // if (__DEV__)
                        //     DevSettings.reload();
                        // else
                        await Updates.reloadAsync();
                    },
                },
                { text: '', style: 'cancel' },
                {
                    text: t('common.arabic') || 'العربية',
                    onPress: async () => {
                        await setLanguage('ar');
                        setLanguageState('ar');

                        if (__DEV__)
                            DevSettings.reload();
                        else
                            await Updates.reloadAsync();
                    },
                },
            ],
            { cancelable: true }
        );
    }, []);

    const handleLogout = () => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true);
                        try {
                            await logout();
                        } catch (err) {
                            console.error('Logout error:', err);
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const getRoleBadge = (role?: UserRole) => {
        const config: Record<string, { label: string; color: string; bg: string }> = {
            [UserRole.SHOP]: { label: t('common.shop'), color: COLORS.primary, bg: COLORS.primarySoft },
            [UserRole.COMPANY]: { label: t('common.company'), color: COLORS.info, bg: COLORS.infoSoft },
            [UserRole.DRIVER]: { label: t('common.driver'), color: COLORS.success, bg: COLORS.successSoft },
            [UserRole.ADMIN]: { label: t('common.admin'), color: COLORS.warning, bg: COLORS.warningSoft },
        };
        const c = config[role || ''] || config[UserRole.SHOP];
        return c;
    };

    const roleBadge = getRoleBadge(user?.role);

    const menuItems = [
        {
            icon: 'person-outline',
            label: t('profile.editProfile'),
            onPress: () => navigation.navigate('EditProfile' as never),
        },
        // {
        //     icon: 'lock-closed-outline',
        //     label: t('profile.changePassword'),
        //     onPress: () => Alert.alert(t('common.noData'), t('common.comingSoon') || 'Coming soon'),
        // },
        {
            icon: 'language-outline',
            label: t('settings.language'),
            onPress: handleChangeLanguage,
        },
        // {
        //     icon: 'notifications-outline',
        //     label: t('settings.notifications'),
        //     onPress: () => Alert.alert(t('common.noData'), t('common.comingSoon') || 'Coming soon'),
        // },
        {
            icon: 'information-circle-outline',
            label: t('settings.about'),
            onPress: () => Alert.alert(t('common.appName'), t('settings.version') + ' 1.0.0'),
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* User Card */}
                <Card style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color={COLORS.white} />
                        </View>
                        <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                            <Text style={[styles.roleText, { color: roleBadge.color }]}>
                                {roleBadge.label}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                </Card>

                {/* Menu Items */}
                <Card style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index < menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuItemLeft}>
                                <View style={styles.menuIconContainer}>
                                    <Ionicons name={item.icon as any} size={20} color={COLORS.gray600} />
                                </View>
                                <Text style={styles.menuItemLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    disabled={loggingOut}
                >
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>
                        {loggingOut ? t('common.loading') : t('settings.logout')}
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray900,
    },
    scrollContent: {
        padding: SPACING.base,
        paddingBottom: 100,
    },
    userCard: {
        alignItems: 'center',
        padding: SPACING.xl,
        marginBottom: SPACING.md,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.full,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    roleText: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xs,
    },
    userName: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
        marginBottom: SPACING.xs,
    },
    userEmail: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
    },
    menuCard: {
        padding: 0,
        marginBottom: SPACING.md,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuItemLabel: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray800,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    logoutText: {
        fontFamily: FONTS.semiBold,
        fontSize: FONT_SIZES.base,
        color: COLORS.error,
        marginLeft: SPACING.sm,
    },
});

export default ProfileScreen;
