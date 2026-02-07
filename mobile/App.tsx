import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, LogBox, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { RootNavigator } from './src/navigation';
import { pushService } from './src/services';
import { useAuthStore } from './src/stores';
import { COLORS } from './src/constants';
import { navigate } from './src/navigation/navigationRef';
import { UserRole } from './src/types';

// // Keep splash screen visible while loading
// SplashScreen.preventAutoHideAsync();

// // Ignore some warnings in development
LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'AsyncStorage has been extracted from react-native core',
    'Require cycle:',
]);

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts - use system fonts as fallback if custom fonts fail
                await Font.loadAsync({
                    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
                    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
                    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
                    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
                }).catch(() => {
                    // Font loading failed, will use system fonts
                    console.log('Custom fonts not available, using system fonts');
                });
            } catch (e) {
                console.warn('Error loading resources:', e);
            } finally {
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    // Initialize push notifications when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const initPush = async () => {
                try {
                    await pushService.initialize();

                    // Set up notification listeners
                    pushService.addNotificationReceivedListener((notification) => {
                        console.log('Notification received:', notification);
                    });

                    pushService.addNotificationResponseListener((response) => {
                        console.log('Notification response:', response);
                        // Handle notification tap - navigate to appropriate screen
                        const data = response.notification.request.content.data;
                        if (data && data.orderId) {
                            const orderId = Number(data.orderId);
                            switch (user.role) {
                                case UserRole.SHOP:
                                    navigate('Shop', { screen: 'OrderDetail', params: { orderId } });
                                    break;
                                case UserRole.COMPANY:
                                    navigate('Company', { screen: 'OrderDetail', params: { orderId } });
                                    break;
                                case UserRole.DRIVER:
                                    navigate('Driver', { screen: 'OrderDetail', params: { orderId } });
                                    break;
                            }
                        }
                    });
                } catch (error) {
                    console.error('Failed to initialize push notifications:', error);
                }
            };

            initPush();
        }
    }, [isAuthenticated, user]);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            await SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
            <SafeAreaProvider>
                <RootNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.gray600,
    },
});