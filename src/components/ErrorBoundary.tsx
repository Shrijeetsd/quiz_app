// Error Boundary Component for Commerce Gate App
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, FONT_SIZES } from '../constants';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Oops! Something went wrong</Text>
        <Text style={styles.message}>
          We apologize for the inconvenience. The app encountered an unexpected error.
        </Text>
        
        {__DEV__ && error && (
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <Text style={styles.errorText}>{error.toString()}</Text>
            {error.stack && (
              <>
                <Text style={styles.errorTitle}>Stack Trace:</Text>
                <Text style={styles.errorText}>{error.stack}</Text>
              </>
            )}
          </ScrollView>
        )}
        
        <TouchableOpacity style={styles.retryButton} onPress={resetError}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: crashlytics().recordError(error);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: '100%',
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: COLORS.SURFACE_LIGHT,
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    maxHeight: 200,
    width: '100%',
  },
  errorTitle: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.BOLD,
    color: COLORS.ERROR,
    marginBottom: 8,
  },
  errorText: {
    fontSize: FONT_SIZES.XS,
    fontFamily: 'Courier',
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});

export default ErrorBoundary;