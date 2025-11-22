// Main Navigation Component for Commerce Gate App
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import {
  ExploreScreen,
  CommunityScreen,
  ProfileScreen,
  CourseSelectionScreen,
  LevelSelectionScreen,
  MCQTestScreen,
  ResultsScreen,
  SettingsScreen,
  TestBrowsingScreen,
} from '../screens/PlaceholderScreens';
import CourseBrowsingScreen from '../screens/CourseBrowsingScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import TestTakingScreen from '../screens/TestTakingScreen';

// Import types and store
import type { RootState } from '../store';
import type { RootStackParamList, TabParamList, AuthStackParamList } from '../types';
import { loadStoredAuth } from '../store/slices/authSlice';
import { COLORS } from '../constants';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator();

// Custom theme configuration
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.LIGHT.PRIMARY,
    background: COLORS.LIGHT.BACKGROUND,
    card: COLORS.LIGHT.SURFACE,
    text: COLORS.LIGHT.TEXT.PRIMARY,
    border: COLORS.LIGHT.BORDER,
  },
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.DARK.PRIMARY,
    background: COLORS.DARK.BACKGROUND,
    card: COLORS.DARK.SURFACE,
    text: COLORS.DARK.TEXT.PRIMARY,
    border: COLORS.DARK.BORDER,
  },
};

// Bottom Tab Navigator Component
const BottomTabNavigator: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  const tabBarOptions = {
    activeTintColor: currentTheme.colors.primary,
    inactiveTintColor: COLORS.NEUTRAL.GRAY_400,
    style: {
      backgroundColor: currentTheme.colors.card,
      borderTopColor: currentTheme.colors.border,
      borderTopWidth: 1,
      paddingBottom: 5,
      height: 60,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Explore':
              iconName = 'explore';
              break;
            case 'Community':
              iconName = 'people';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: tabBarOptions.activeTintColor,
        tabBarInactiveTintColor: tabBarOptions.inactiveTintColor,
        tabBarStyle: tabBarOptions.style,
        tabBarLabelStyle: tabBarOptions.labelStyle,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Authentication Stack Navigator
const AuthStackNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Drawer Navigator Component
const DrawerNavigator: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: currentTheme.colors.card,
          width: 280,
        },
        drawerActiveTintColor: currentTheme.colors.primary,
        drawerInactiveTintColor: currentTheme.colors.text,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{
          title: 'Commerce Gate',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Main App Navigator Component
const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { theme } = useSelector((state: RootState) => state.ui);
  const [isAppReady, setIsAppReady] = React.useState(false);

  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  // Load stored authentication data on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load stored auth data
        await dispatch(loadStoredAuth()).unwrap();
      } catch (error) {
        console.error('Failed to load stored auth:', error);
      } finally {
        // Show splash screen for minimum 2 seconds
        setTimeout(() => {
          setIsAppReady(true);
        }, 2000);
      }
    };

    initializeApp();
  }, [dispatch]);

  // Show splash screen while app is initializing
  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={currentTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: currentTheme.colors.background },
        }}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen
              name="CourseSelection"
              component={CourseSelectionScreen}
              options={{
                headerShown: true,
                title: 'Select Course',
                headerStyle: {
                  backgroundColor: currentTheme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="LevelSelection"
              component={LevelSelectionScreen}
              options={{
                headerShown: true,
                title: 'Select Level',
                headerStyle: {
                  backgroundColor: currentTheme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="MCQTest"
              component={MCQTestScreen}
              options={{
                headerShown: true,
                title: 'Test',
                headerLeft: () => null, // Disable back button during test
                headerStyle: {
                  backgroundColor: currentTheme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{
                headerShown: true,
                title: 'Test Results',
                headerLeft: () => null, // Disable back button on results
                headerStyle: {
                  backgroundColor: currentTheme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="CourseBrowsing"
              component={CourseBrowsingScreen}
              options={{
                headerShown: false,
                title: 'Browse Courses',
              }}
            />
            <Stack.Screen
              name="CourseDetail"
              component={CourseDetailScreen}
              options={{
                headerShown: false,
                title: 'Course Details',
              }}
            />
            <Stack.Screen
              name="TestBrowsing"
              component={TestBrowsingScreen}
              options={{
                headerShown: true,
                title: 'Browse Tests',
                headerStyle: {
                  backgroundColor: currentTheme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="TestTaking"
              component={TestTakingScreen}
              options={{
                headerShown: false,
                title: 'Test',
                gestureEnabled: false, // Disable swipe to go back during test
              }}
            />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;