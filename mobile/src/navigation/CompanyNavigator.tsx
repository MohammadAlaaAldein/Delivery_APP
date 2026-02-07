import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import {
    CompanyDashboardScreen,
    CompanyAvailableOrdersScreen,
    CompanyDriversScreen,
    ProfileScreen,
} from '../screens';
import { ShopOrderDetailScreen } from '../screens';
import { CompanyStackParamList } from '../types';
import { COLORS, FONTS, SPACING } from '../constants';

const Stack = createNativeStackNavigator<CompanyStackParamList>();
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

const CompanyTabs: React.FC = () => {
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
                component={CompanyDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="AvailableOrdersTab"
                component={CompanyAvailableOrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'cube' : 'cube-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="DriversTab"
                component={CompanyDriversScreen}
                options={{
                    tabBarLabel: 'Drivers',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
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

const CompanyNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Dashboard" component={CompanyTabs} />
            <Stack.Screen name="AvailableOrders" component={CompanyAvailableOrdersScreen} />
            <Stack.Screen name="Available" component={CompanyAvailableOrdersScreen} />
            <Stack.Screen name="Drivers" component={CompanyDriversScreen} />
            <Stack.Screen name="MyOrders" component={CompanyAvailableOrdersScreen} />
            <Stack.Screen name="OrderDetail" component={ShopOrderDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
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
});

export default CompanyNavigator;
