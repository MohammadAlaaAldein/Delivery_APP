import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import {
    ShopDashboardScreen,
    ShopOrdersScreen,
    ShopCreateOrderScreen,
    ShopOrderDetailScreen,
} from '../screens';
import { ShopStackParamList } from '../types';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

const Stack = createNativeStackNavigator<ShopStackParamList>();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, size }: { name: any; focused: boolean; size: number }) => (
    <View style={styles.tabIconContainer}>
        <Ionicons
            name={name}
            size={size}
            color={focused ? COLORS.primary : COLORS.gray400}
        />
        {focused && <View style={styles.tabIndicator} />}
    </View>
);

const ShopTabs: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray400,
                tabBarLabelStyle: {
                    fontFamily: FONTS.medium,
                    fontSize: 11,
                },
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    paddingTop: SPACING.xs,
                    paddingBottom: SPACING.sm,
                    height: 65,
                },
            }}
        >
            <Tab.Screen
                name="DashboardTab"
                component={ShopDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="OrdersTab"
                component={ShopOrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'cube' : 'cube-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="CreateOrderTab"
                component={ShopCreateOrderScreen}
                options={{
                    tabBarLabel: 'New Order',
                    tabBarIcon: ({ focused, size }) => (
                        <View style={styles.addButtonContainer}>
                            <View style={styles.addButton}>
                                <Ionicons name="add" size={28} color={COLORS.white} />
                            </View>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ShopDashboardScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const ShopNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Dashboard" component={ShopTabs} />
            <Stack.Screen name="Orders" component={ShopOrdersScreen} />
            <Stack.Screen name="CreateOrder" component={ShopCreateOrderScreen} />
            <Stack.Screen name="OrderDetail" component={ShopOrderDetailScreen} />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
    addButtonContainer: {
        position: 'absolute',
        top: -20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default ShopNavigator;
