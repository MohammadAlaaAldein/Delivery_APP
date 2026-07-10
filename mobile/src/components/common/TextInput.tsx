import React, { useState } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    TextInputProps as RNTextInputProps,
    ViewStyle,
    TouchableOpacity,
    I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, INPUT_HEIGHTS, SHADOWS } from '../../constants';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    size?: 'sm' | 'md' | 'lg';
    required?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    size = 'md',
    required = false,
    secureTextEntry,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    height: INPUT_HEIGHTS.sm,
                    fontSize: FONT_SIZES.sm,
                    iconSize: 18,
                };
            case 'lg':
                return {
                    height: INPUT_HEIGHTS.lg,
                    fontSize: FONT_SIZES.lg,
                    iconSize: 24,
                };
            case 'md':
            default:
                return {
                    height: INPUT_HEIGHTS.md,
                    fontSize: FONT_SIZES.base,
                    iconSize: 20,
                };
        }
    };

    const sizeStyles = getSizeStyles();
    const isRTL = I18nManager.isRTL;

    const getBorderColor = () => {
        if (error) return COLORS.error;
        if (isFocused) return COLORS.primary;
        return COLORS.border;
    };

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {required && <Text style={styles.required}>*</Text>}
                </View>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        height: sizeStyles.height,
                        borderColor: getBorderColor(),
                    },
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {leftIcon && (
                    <View style={[styles.iconWrapper, { start: SPACING.sm }]}> 
                        <Ionicons
                            name={leftIcon}
                            size={sizeStyles.iconSize}
                            color={isFocused ? COLORS.primary : COLORS.gray400}
                        />
                    </View>
                )}

                <RNTextInput
                    style={[
                        styles.input,
                        {
                            fontSize: sizeStyles.fontSize,
                            paddingStart: leftIcon ? 44 : SPACING.base,
                            paddingEnd: (rightIcon || secureTextEntry) ? 44 : SPACING.base,
                            textAlign: isRTL ? 'right' : 'left',
                            writingDirection: isRTL ? 'rtl' : 'ltr',
                        },
                    ]}
                    placeholderTextColor={COLORS.gray400}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    textAlignVertical="center"
                    allowFontScaling={false}
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={[styles.iconWrapper, styles.iconRightWrapper, { end: SPACING.sm }]}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={sizeStyles.iconSize}
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={[styles.iconWrapper, styles.iconRightWrapper, { end: SPACING.sm }]}
                        disabled={!onRightIconPress}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={sizeStyles.iconSize}
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {(error || hint) && (
                <Text style={[styles.helperText, error && styles.errorText]}>
                    {error || hint}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.base,
    },
    labelContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.xs,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray700,
    },
    required: {
        color: COLORS.error,
        marginLeft: 2,
    },
    inputContainer: {
        position: 'relative',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderRadius: RADIUS.base,
        ...SHADOWS.sm,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        ...SHADOWS.base,
    },
    inputContainerError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorSoft,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        height: '100%',
        minHeight: 40,
    },
    iconWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        width: 44,
    },
    iconRightWrapper: {
        end: SPACING.sm,
    },
    rightIconContainer: {
        padding: SPACING.md,
    },
    helperText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.xs,
        color: COLORS.gray500,
        marginTop: SPACING.xs,
    },
    errorText: {
        color: COLORS.error,
    },
});

export default TextInput;
