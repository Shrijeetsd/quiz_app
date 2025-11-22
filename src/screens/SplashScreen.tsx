// Splash Screen Component for Commerce Gate App
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { COLORS, FONTS, FONT_SIZES } from '../constants';

const SplashScreen: React.FC = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Logo scale animation
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Fade in and slide up tagline
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoAnimation, fadeAnimation, slideAnimation]);

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor={COLORS.PRIMARY} 
        barStyle="light-content" 
        translucent={false}
      />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main logo and branding */}
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [
                {
                  scale: logoAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>CG</Text>
          </View>
          <Text style={styles.logoText}>Commerce Gate</Text>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <Text style={styles.taglineText}>Master Your Skills</Text>
          <Text style={styles.subtitleText}>Excel in Every Test</Text>
        </Animated.View>
      </View>
      
      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnimation }
        ]}
      >
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIconText: {
    fontSize: 32,
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  logoText: {
    fontSize: 36,
    fontFamily: FONTS.BOLD,
    color: COLORS.WHITE,
    textAlign: 'center',
    letterSpacing: 1,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  taglineText: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.REGULAR,
    color: COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
});

export default SplashScreen;