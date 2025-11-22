// Loading Screen Component for Commerce Gate App
import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { COLORS, FONTS } from '../constants';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  showLogo = true 
}) => {
  return (
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Commerce Gate</Text>
          <Text style={styles.taglineText}>Master Your Skills</Text>
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.PRIMARY} 
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    fontFamily: FONTS.BOLD,
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
});

export default LoadingScreen;