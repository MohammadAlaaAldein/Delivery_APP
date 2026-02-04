import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS, ICON_SIZES } from '../../constants';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'outlined' | 'elevated';
    gradient?: boolean;
    gradientColors?: [string, string];
    onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    gradient = false,
    gradientColors = COLORS.gradientPrimary as [string, string],
    onPress,
}) => {
    const getVariantStyles = (): ViewStyle => {
        switch (variant) {
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                };
            case 'elevated':
                return {
                    ...SHADOWS.lg,
                };
            default:
                return {
                    ...SHADOWS.base,
                };
        }
    };

    const cardContent = gradient ? (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.gradient, getVariantStyles(), style]}
        >
            {children}
        </LinearGradient>
    ) : (
        <View style={[styles.card, getVariantStyles(), style]}>{children}</View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
};

// Badge Component
interface BadgeProps {
    text?: string;
    label?: string; // Alias for text
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    label,
    variant = 'primary',
    size = 'md',
    style,
    textStyle,
}) => {
    const displayText = text || label || '';
    const getVariantColors = () => {
        switch (variant) {
            case 'secondary':
                return { bg: COLORS.secondarySoft, text: COLORS.secondary };
            case 'success':
                return { bg: COLORS.successSoft, text: COLORS.success };
            case 'warning':
                return { bg: COLORS.warningSoft, text: COLORS.warning };
            case 'danger':
                return { bg: COLORS.errorSoft, text: COLORS.error };
            case 'info':
                return { bg: COLORS.infoSoft, text: COLORS.info };
            case 'gray':
                return { bg: COLORS.gray100, text: COLORS.gray600 };
            default:
                return { bg: COLORS.primarySoft, text: COLORS.primary };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { padding: SPACING.xs, fontSize: FONT_SIZES.xs };
            case 'lg':
                return { padding: SPACING.md, fontSize: FONT_SIZES.md };
            default:
                return { padding: SPACING.sm, fontSize: FONT_SIZES.sm };
        }
    };

    const colors = getVariantColors();
    const sizeStyles = getSizeStyles();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: colors.bg,
                    paddingVertical: sizeStyles.padding / 2,
                    paddingHorizontal: sizeStyles.padding,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.badgeText,
                    { color: colors.text, fontSize: sizeStyles.fontSize },
                    textStyle,
                ]}
            >
                {displayText}
            </Text>
        </View>
    );
};

// Loading Component
interface LoadingProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
    message?: string; // Alias for text
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'large',
    color = COLORS.primary,
    text,
    message,
    fullScreen = false,
}) => {
    const displayText = text || message;

    const LoadingContent = (
        <View style={[styles.loadingContainer, fullScreen && styles.fullScreen]}>
            <View style={styles.loadingSpinner}>
                <View style={[styles.spinnerDot, { backgroundColor: color }]} />
                <View style={[styles.spinnerDot, styles.spinnerDot2, { backgroundColor: color }]} />
                <View style={[styles.spinnerDot, styles.spinnerDot3, { backgroundColor: color }]} />
            </View>
            {displayText && <Text style={styles.loadingText}>{displayText}</Text>}
        </View>
    );

    if (fullScreen) {
        return <View style={styles.fullScreenOverlay}>{LoadingContent}</View>;
    }

    return LoadingContent;
};

// Empty State Component
interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    actionText?: string;
    actionLabel?: string; // Alias for actionText
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'folder-open-outline',
    title,
    description,
    actionText,
    actionLabel,
    onAction,
}) => {
    const buttonText = actionText || actionLabel;

    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name={icon} size={64} color={COLORS.gray300} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            {description && <Text style={styles.emptyDescription}>{description}</Text>}
            {buttonText && onAction && (
                <TouchableOpacity onPress={onAction} style={styles.emptyAction}>
                    <Text style={styles.emptyActionText}>{buttonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = COLORS.primary,
    trend,
    onPress,
}) => {
    return (
        <Card style={styles.statCard} onPress={onPress}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={ICON_SIZES.lg} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                {trend && (
                    <View style={styles.trendContainer}>
                        <Ionicons
                            name={trend.isPositive ? 'trending-up' : 'trending-down'}
                            size={14}
                            color={trend.isPositive ? COLORS.success : COLORS.error}
                        />
                        <Text
                            style={[
                                styles.trendText,
                                { color: trend.isPositive ? COLORS.success : COLORS.error },
                            ]}
                        >
                            {trend.value}%
                        </Text>
                    </View>
                )}
            </View>
        </Card>
    );
};

// Divider Component
interface DividerProps {
    text?: string;
    style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ text, style }) => {
    if (text) {
        return (
            <View style={[styles.dividerContainer, style]}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{text}</Text>
                <View style={styles.dividerLine} />
            </View>
        );
    }

    return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
    // Card styles
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.base,
    },
    gradient: {
        overflow: 'hidden',
    },

    // Badge styles
    badge: {
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontFamily: FONTS.medium,
        fontWeight: '600',
    },

    // Loading styles
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    fullScreen: {
        flex: 1,
    },
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    loadingSpinner: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
        opacity: 0.3,
    },
    spinnerDot2: {
        opacity: 0.6,
    },
    spinnerDot3: {
        opacity: 1,
    },
    loadingText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: SPACING.md,
    },

    // Empty State styles
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING['2xl'],
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.gray50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES.lg,
        color: COLORS.gray700,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    emptyDescription: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.md,
        color: COLORS.gray500,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyAction: {
        marginTop: SPACING.lg,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    emptyActionText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.base,
        color: COLORS.primary,
    },

    // Stat Card styles
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.base,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.base,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontFamily: FONTS.bold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.gray900,
    },
    statTitle: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray500,
        marginTop: 2,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    trendText: {
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.xs,
        marginLeft: 4,
    },

    // Divider styles
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: SPACING.base,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.base,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.divider,
    },
    dividerText: {
        fontFamily: FONTS.regular,
        fontSize: FONT_SIZES.sm,
        color: COLORS.gray400,
        marginHorizontal: SPACING.md,
    },
});

export default {
    Card,
    Badge,
    Loading,
    EmptyState,
    StatCard,
    Divider,
};
