// @ts-nocheck
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, TextInput } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, SCREEN } from '../../constants';
import { useAuthStore } from '../../stores';
import { t } from '../../i18n';
import { AuthStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError(t('validation.required', { field: t('auth.email') }));
            return false;
        }
        if (!emailRegex.test(value)) {
            setEmailError(t('validation.email'));
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (value: string) => {
        if (!value) {
            setPasswordError(t('validation.required', { field: t('auth.password') }));
            return false;
        }
        if (value.length < 6) {
            setPasswordError(t('validation.minLength', { field: t('auth.password'), min: 6 }));
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleLogin = async () => {
        clearError();
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        try {
            await login(email, password);
            // Navigation will be handled by the RootNavigator based on auth state
        } catch (err: any) {
            Alert.alert(
                t('common.error'),
                err.response?.data?.message || t('auth.invalidCredentials')
            );
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Background Gradient */}
            <LinearGradient
                colors={COLORS.gradientPrimary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    {/* Logo placeholder */}
                    <View style={styles.logoContainer}>
                        <Ionicons name="cube" size={60} color={COLORS.white} />
                    </View>
                    <Text style={styles.appName}>{t('common.appName')}</Text>
                    <Text style={styles.headerSubtitle}>Fast & Reliable Delivery</Text>
                </View>

                {/* Decorative circles */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Login Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
                        <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Email Input */}
                        <TextInput
                            label={t('auth.email')}
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) validateEmail(text);
                            }}
                            onBlur={() => validateEmail(email)}
                            error={emailError}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            required
                        />

                        {/* Password Input */}
                        <TextInput
                            label={t('auth.password')}
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (passwordError) validatePassword(text);
                            }}
                            onBlur={() => validatePassword(password)}
                            error={passwordError}
                            leftIcon="lock-closed-outline"
                            secureTextEntry
                            required
                        />

                        {/* Forgot Password */}
                        <TouchableOpacity
                            onPress={handleForgotPassword}
                            style={styles.forgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <Button
                            title={t('auth.login')}
                            onPress={handleLogin}
                            loading={isLoading}
                            fullWidth
                            icon="log-in-outline"
                        />

                        {/* Language Toggle */}
                        <TouchableOpacity style={styles.languageToggle}>
                            <Ionicons name="globe-outline" size={20} color={COLORS.gray500} />
                            <Text style={styles.languageText}>
                                {t('common.english')} / {t('common.arabic')}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    headerGradient: {
        height: SCREEN.height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    appName: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['3xl'],
        color: COLORS.white,
        marginBottom: SPACING.xs,
    },
    headerSubtitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: 'rgba(255,255,255,0.8)',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle1: {
        width: 200,
        height: 200,
        top: -50,
        right: -50,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: -30,
        left: -30,
    },
    circle3: {
        width: 100,
        height: 100,
        top: 40,
        left: 20,
    },
    keyboardView: {
        flex: 1,
        marginTop: -SPACING['2xl'],
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING['2xl'],
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        ...SHADOWS.lg,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.gray900,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray500,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.errorSoft,
        borderRadius: RADIUS.base,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.error,
        marginLeft: SPACING.sm,
        flex: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.lg,
    },
    forgotPasswordText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
    },
    languageToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl,
        padding: SPACING.sm,
    },
    languageText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginLeft: SPACING.xs,
    },
});

export default LoginScreen;

