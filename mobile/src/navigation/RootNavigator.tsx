import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores';
import { UserRole } from '../types';
import { Loading } from '../components/common';
import AuthNavigator from './AuthNavigator';
import ShopNavigator from './ShopNavigator';
import CompanyNavigator from './CompanyNavigator';
import DriverNavigator from './DriverNavigator';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
    const { isAuthenticated, user, isLoading, initialize, isInitialized } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const prepare = async () => {
            try {
                await initialize();
            } catch (e) {
                console.warn('Error initializing auth:', e);
            } finally {
                setIsReady(true);
                await SplashScreen.hideAsync();
            }
        };

        prepare();
    }, []);

    if (!isReady || !isInitialized) {
        return <Loading fullScreen message="Loading..." />;
    }

    const getMainNavigator = () => {
        if (!isAuthenticated || !user) {
            return <Stack.Screen name="Auth" component={AuthNavigator} />;
        }

        switch (user.role) {
            case UserRole.SHOP:
                return <Stack.Screen name="Shop" component={ShopNavigator} />;
            case UserRole.COMPANY:
                return <Stack.Screen name="Company" component={CompanyNavigator} />;
            case UserRole.DRIVER:
                return <Stack.Screen name="Driver" component={DriverNavigator} />;
            case UserRole.ADMIN:
                return <Stack.Screen name="Company" component={CompanyNavigator} />;
            default:
                return <Stack.Screen name="Auth" component={AuthNavigator} />;
        }
    };

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                {getMainNavigator()}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
