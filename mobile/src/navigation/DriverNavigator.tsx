import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import {
    DriverDashboardScreen,
    DriverActiveOrdersScreen,
    DriverHistoryScreen,
    DriverOrderDetailScreen,
    ProfileScreen,
} from '../screens';
import { DriverStackParamList } from '../types';
import { COLORS, FONTS, SPACING } from '../constants';

const Stack = createNativeStackNavigator<DriverStackParamList>();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, size }: { name: any; focused: boolean; size: number }) => (
    <View style={styles.tabIconContainer}>
        <Ionicons
            name={name}
            size={size}
            color={focused ? COLORS.success : COLORS.gray400}
        />
        {focused && <View style={[styles.tabIndicator, { backgroundColor: COLORS.success }]} />}
    </View>
);

const DriverTabs: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.success,
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
                component={DriverDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="ActiveOrdersTab"
                component={DriverActiveOrdersScreen}
                options={{
                    tabBarLabel: 'Deliveries',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'car' : 'car-outline'} focused={focused} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={DriverHistoryScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ focused, size }) => (
                        <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} size={size} />
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

const DriverNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Dashboard" component={DriverTabs} />
            <Stack.Screen name="ActiveOrders" component={DriverActiveOrdersScreen} />
            <Stack.Screen name="History" component={DriverHistoryScreen} />
            <Stack.Screen name="OrderDetail" component={DriverOrderDetailScreen} />
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
        backgroundColor: COLORS.success,
    },
});

export default DriverNavigator;
