import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar, View, Text, ActivityIndicator, Alert } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { appServices, AppServicesStatus } from './src/services/appServices';

// Advanced initialization screen component
const InitializationScreen: React.FC<{
  progress: number;
  currentService: string;
  status: AppServicesStatus | null;
}> = ({ progress, currentService, status }) => (
  <SafeAreaProvider>
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      paddingHorizontal: 20,
    }}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 280,
      }}>
        {/* App Logo */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#2563eb',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>CG</Text>
        </View>

        {/* App Title */}
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: 8,
        }}>
          Commerce Gate
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: '#666',
          marginBottom: 16,
        }}>
          Learning Excellence Platform
        </Text>

        {/* Progress Bar */}
        <View style={{
          width: '100%',
          height: 4,
          backgroundColor: '#e0e0e0',
          borderRadius: 2,
          marginVertical: 16,
        }}>
          <View style={{
            height: '100%',
            backgroundColor: '#2563eb',
            borderRadius: 2,
            width: `${progress}%`,
          }} />
        </View>

        {/* Progress Percentage */}
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#2563eb',
          marginBottom: 8,
        }}>
          {Math.round(progress)}%
        </Text>

        {/* Current Service */}
        <Text style={{
          fontSize: 14,
          color: '#666',
          textAlign: 'center',
          marginBottom: 16,
          minHeight: 20,
        }}>
          {currentService}
        </Text>

        {/* Activity Indicator */}
        <ActivityIndicator size="large" color="#2563eb" />

        {/* Service Status (Development Mode) */}
        {__DEV__ && status && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              Services: {status.services.filter(s => s.initialized).length}/{status.services.length}
            </Text>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              Time: {status.totalInitTime}ms
            </Text>
            {status.hasErrors && (
              <Text style={{ fontSize: 12, color: '#ff6b6b' }}>
                ⚠️ Some services failed
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  </SafeAreaProvider>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [currentService, setCurrentService] = useState('Starting up...');
  const [servicesStatus, setServicesStatus] = useState<AppServicesStatus | null>(null);
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting Commerce Gate App initialization...');
        
        // Update progress periodically during initialization
        const progressInterval = setInterval(() => {
          const progress = appServices.getInitializationProgress();
          setInitProgress(progress.progress);
          setCurrentService(progress.currentService);
          
          if (progress.isComplete) {
            clearInterval(progressInterval);
          }
        }, 100);

        // Initialize all app services
        const status = await appServices.initializeAll();
        setServicesStatus(status);

        // Clear the progress interval
        clearInterval(progressInterval);

        // Final progress update
        setInitProgress(100);
        setCurrentService('Launching app...');

        // Check if critical services are healthy
        if (!appServices.areServicesHealthy()) {
          console.warn('⚠️ Some critical services failed to initialize');
          
          if (!__DEV__) {
            // In production, show alert for critical failures
            Alert.alert(
              'Service Warning',
              'Some app features may not work properly. The app will continue with limited functionality.',
              [
                {
                  text: 'Continue',
                  onPress: () => setIsLoading(false),
                },
                {
                  text: 'Retry',
                  onPress: () => {
                    setIsLoading(true);
                    setInitProgress(0);
                    setCurrentService('Retrying initialization...');
                    setTimeout(() => initializeApp(), 1000);
                  },
                },
              ]
            );
            return;
          }
        }

        // Track successful initialization
        console.log(`✅ App initialization completed in ${status.totalInitTime}ms`);
        
        // Small delay to show completion state
        setTimeout(() => {
          setIsLoading(false);
        }, 800);

      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitializationFailed(true);
        
        Alert.alert(
          'Initialization Failed',
          'The app failed to start properly. Please check your internet connection and try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setInitializationFailed(false);
                setIsLoading(true);
                setInitProgress(0);
                setCurrentService('Retrying initialization...');
                setTimeout(() => initializeApp(), 1000);
              },
            },
            {
              text: 'Continue Anyway',
              style: 'cancel',
              onPress: () => {
                setInitializationFailed(false);
                setIsLoading(false);
              },
            },
          ]
        );
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      appServices.cleanup();
    };
  }, []);

  // Show initialization screen while loading
  if (isLoading && !initializationFailed) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <InitializationScreen
          progress={initProgress}
          currentService={currentService}
          status={servicesStatus}
        />
      </>
    );
  }

  // Show error state if initialization failed and user didn't choose to continue
  if (initializationFailed) {
    return (
      <SafeAreaProvider>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <Text style={{ 
              fontSize: 18, 
              color: '#ff6b6b', 
              fontWeight: 'bold',
              textAlign: 'center', 
              marginBottom: 12 
            }}>
              ⚠️ Initialization Failed
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#666', 
              textAlign: 'center',
              lineHeight: 20,
            }}>
              The app failed to initialize properly.{'\n'}
              Please check your internet connection{'\n'}
              and restart the app.
            </Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <SafeAreaProvider>
            <PaperProvider>
              <StatusBar
                barStyle="light-content"
                backgroundColor="#2563eb"
                translucent={false}
              />
              <AppNavigator />
            </PaperProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
