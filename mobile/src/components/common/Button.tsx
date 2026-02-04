import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, BUTTON_HEIGHTS, SHADOWS } from '../../constants';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    gradient: COLORS.gradientSecondary,
                    textColor: COLORS.white,
                };
            case 'success':
                return {
                    gradient: COLORS.gradientSuccess,
                    textColor: COLORS.white,
                };
            case 'danger':
                return {
                    gradient: COLORS.gradientError,
                    textColor: COLORS.white,
                };
            case 'warning':
                return {
                    gradient: COLORS.gradientWarning,
                    textColor: COLORS.white,
                };
            case 'outline':
                return {
                    gradient: null,
                    textColor: COLORS.primary,
                    borderColor: COLORS.primary,
                };
            case 'ghost':
                return {
                    gradient: null,
                    textColor: COLORS.primary,
                };
            case 'primary':
            default:
                return {
                    gradient: COLORS.gradientPrimary,
                    textColor: COLORS.white,
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    height: BUTTON_HEIGHTS.sm,
                    paddingHorizontal: SPACING.md,
                    fontSize: FONT_SIZES.sm,
                    iconSize: 16,
                };
            case 'lg':
                return {
                    height: BUTTON_HEIGHTS.lg,
                    paddingHorizontal: SPACING.xl,
                    fontSize: FONT_SIZES.lg,
                    iconSize: 24,
                };
            case 'md':
            default:
                return {
                    height: BUTTON_HEIGHTS.md,
                    paddingHorizontal: SPACING.lg,
                    fontSize: FONT_SIZES.base,
                    iconSize: 20,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const containerStyle: ViewStyle = {
        height: sizeStyles.height,
        borderRadius: RADIUS.base,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        ...SHADOWS.base,
    };

    const buttonContent = (
        <View style={[styles.content, { paddingHorizontal: sizeStyles.paddingHorizontal }]}>
            {loading ? (
                <ActivityIndicator color={variantStyles.textColor} size="small" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={variantStyles.textColor}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: variantStyles.textColor,
                                fontSize: sizeStyles.fontSize,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={variantStyles.textColor}
                            style={styles.iconRight}
                        />
                    )}
                </>
            )}
        </View>
    );

    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.7}
                style={[
                    containerStyle,
                    styles.outlineButton,
                    { borderColor: variantStyles.borderColor, height: sizeStyles.height },
                    style,
                ]}
            >
                {buttonContent}
            </TouchableOpacity>
        );
    }

    if (variant === 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.7}
                style={[containerStyle, styles.ghostButton, { height: sizeStyles.height }, style]}
            >
                {buttonContent}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[containerStyle, style]}
        >
            <LinearGradient
                colors={variantStyles.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, { height: sizeStyles.height }]}
            >
                {buttonContent}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: FONTS.medium,
        fontWeight: '600',
    },
    iconLeft: {
        marginRight: SPACING.xs,
    },
    iconRight: {
        marginLeft: SPACING.xs,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ghostButton: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Button;
