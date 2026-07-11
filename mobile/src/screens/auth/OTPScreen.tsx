// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
    TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants';
import { authService } from '../../services';
import { t } from '../../i18n';
import { AuthStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type RouteProps = RouteProp<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

const OTPScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { email } = route.params;

    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');

    const inputRefs = useRef<(RNTextInput | null)[]>([]);

    useEffect(() => {
        // Start countdown timer
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        setError('');

        if (value.length > 1) {
            // Handle paste
            const pastedCode = value.slice(0, OTP_LENGTH).split('');
            const newOtp = [...otp];
            pastedCode.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            const nextIndex = Math.min(index + pastedCode.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            setError(t('auth.otpInvalid'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authService.verifyOTP({ email, code });
            // Navigation handled by auth state
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.otpInvalid'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(RESEND_TIMEOUT);

        try {
            await authService.resendOTP(email);
            Alert.alert(t('common.success'), 'Verification code sent!');

            // Restart timer
            const timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            setCanResend(true);
            Alert.alert(t('common.error'), err.response?.data?.message || t('errors.unknownError'));
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const isComplete = otp.every((digit) => digit !== '');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

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
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={COLORS.gradientPrimary as [string, string]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="shield-checkmark" size={40} color={COLORS.white} />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('auth.otpTitle')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.otpSubtitle')}
                    </Text>
                    <Text style={styles.email}>{email}</Text>

                    {/* Error */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.otpBox,
                                    digit && styles.otpBoxFilled,
                                    error && styles.otpBoxError,
                                ]}
                            >
                                <RNTextInput
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={styles.otpInput}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            </View>
                        ))}
                    </View>

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResend}>
                                <Text style={styles.resendText}>{t('auth.otpResend')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.timerText}>
                                {t('auth.otpResendIn', { seconds: resendTimer })}
                            </Text>
                        )}
                    </View>

                    {/* Verify Button */}
                    <Button
                        title="Verify"
                        onPress={handleVerify}
                        loading={isLoading}
                        disabled={!isComplete}
                        fullWidth
                        icon="checkmark-circle-outline"
                    />
                </View>
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
    content: {
        flex: 1,
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
    },
    email: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: SPACING.xs,
        marginBottom: SPACING.xl,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.error,
        marginLeft: SPACING.xs,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderRadius: RADIUS.base,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        marginHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    otpBoxFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primarySoft,
    },
    otpBoxError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorSoft,
    },
    otpInput: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.xl,
        color: COLORS.gray900,
        textAlign: 'center',
        width: '100%',
        height: '100%',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    resendText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
    },
    timerText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.base,
        color: COLORS.gray500,
    },
});

export default OTPScreen;

