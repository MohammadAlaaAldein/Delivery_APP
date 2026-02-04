// @ts-nocheck
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, TextInput } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { authService } from '../../services';
import { t } from '../../i18n';
import { AuthStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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

    const handleSubmit = async () => {
        if (!validateEmail(email)) {
            return;
        }

        setIsLoading(true);

        try {
            await authService.forgotPassword({ email });
            setIsSuccess(true);
        } catch (err: any) {
            Alert.alert(
                t('common.error'),
                err.response?.data?.message || t('errors.unknownError')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                        <LinearGradient
                            colors={COLORS.gradientSuccess as [string, string]}
                            style={styles.successIconGradient}
                        >
                            <Ionicons name="checkmark" size={50} color={COLORS.white} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.successTitle}>Email Sent!</Text>
                    <Text style={styles.successText}>
                        {t('auth.resetPasswordSuccess')}
                    </Text>
                    <Text style={styles.successEmail}>{email}</Text>
                    <Button
                        title="Back to Login"
                        onPress={handleBack}
                        variant="outline"
                        fullWidth
                        style={{ marginTop: SPACING.xl }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={COLORS.gradientPrimary as [string, string]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="lock-open" size={40} color={COLORS.white} />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.forgotPasswordSubtitle')}
                    </Text>

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

                    {/* Submit Button */}
                    <Button
                        title="Send Reset Link"
                        onPress={handleSubmit}
                        loading={isLoading}
                        fullWidth
                        icon="send-outline"
                        style={{ marginTop: SPACING.md }}
                    />

                    {/* Back to Login */}
                    <TouchableOpacity onPress={handleBack} style={styles.backToLogin}>
                        <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
                    </TouchableOpacity>
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
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.gray900,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.md,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl,
        padding: SPACING.sm,
    },
    backToLoginText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    successIconContainer: {
        marginBottom: SPACING.xl,
    },
    successIconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    successTitle: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.gray900,
        marginBottom: SPACING.md,
    },
    successText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 22,
    },
    successEmail: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
});

export default ForgotPasswordScreen;

