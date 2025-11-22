import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';
import { apiService } from './apiService';

// Types for payment integration
export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
  upiId?: string;
  walletType?: string;
  bankName?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  clientSecret?: string;
  metadata: {
    courseId?: string;
    subscriptionPlanId?: string;
    userId: string;
    type: 'course_purchase' | 'subscription' | 'test_series';
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  trialPeriodDays?: number;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  paymentMethod: PaymentMethod;
  createdAt: string;
  description: string;
  receiptUrl?: string;
  refundAmount?: number;
  metadata: {
    courseId?: string;
    subscriptionId?: string;
    type: string;
  };
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund amount
  reason: string;
  metadata?: Record<string, any>;
}

// Stripe/Razorpay configuration
export interface PaymentConfig {
  stripe: {
    publishableKey: string;
    merchantId: string;
    countryCode: string;
  };
  razorpay: {
    keyId: string;
    keySecret?: string; // Only on server
  };
  applePay: {
    merchantId: string;
    supportedNetworks: string[];
  };
  googlePay: {
    environment: 'TEST' | 'PRODUCTION';
    merchantId: string;
    gatewayMerchantId: string;
  };
}

class PaymentService {
  private paymentConfig: PaymentConfig | null = null;
  private isInitialized: boolean = false;
  private supportedMethods: string[] = [];

  /**
   * Initialize payment service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Get payment configuration from server
      await this.loadPaymentConfig();

      // Initialize payment SDKs
      await this.initializePaymentSDKs();

      // Check supported payment methods
      await this.checkSupportedMethods();

      this.isInitialized = true;
      console.log('Payment service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
    }
  }

  /**
   * Load payment configuration
   */
  private async loadPaymentConfig(): Promise<void> {
    try {
      const response: any = await apiService.get('/payments/config');
      this.paymentConfig = response.data.config;
    } catch (error) {
      console.error('Failed to load payment config:', error);
      // Use default/cached config
      const cached = await AsyncStorage.getItem('payment_config');
      if (cached) {
        this.paymentConfig = JSON.parse(cached);
      }
    }
  }

  /**
   * Initialize payment SDKs
   */
  private async initializePaymentSDKs(): Promise<void> {
    if (!this.paymentConfig) return;

    // Initialize Stripe (when Stripe SDK is added)
    // await stripe.initStripe({
    //   publishableKey: this.paymentConfig.stripe.publishableKey,
    //   merchantIdentifier: this.paymentConfig.stripe.merchantId,
    // });

    // Initialize Razorpay (when Razorpay SDK is added)
    // RazorpayCheckout.open({
    //   key: this.paymentConfig.razorpay.keyId,
    // });

    console.log('Payment SDKs initialized');
  }

  /**
   * Check supported payment methods on device
   */
  private async checkSupportedMethods(): Promise<void> {
    this.supportedMethods = ['card', 'upi']; // Default methods

    if (Platform.OS === 'ios') {
      // Check Apple Pay support
      // const isApplePaySupported = await stripe.isApplePaySupported();
      // if (isApplePaySupported) {
      //   this.supportedMethods.push('apple_pay');
      // }
    }

    if (Platform.OS === 'android') {
      // Check Google Pay support
      // const isGooglePaySupported = await stripe.isGooglePaySupported();
      // if (isGooglePaySupported) {
      //   this.supportedMethods.push('google_pay');
      // }
    }

    // Check for UPI apps
    const upiApps = ['paytm', 'phonepe', 'googlepay', 'bhim'];
    for (const app of upiApps) {
      try {
        const canOpen = await Linking.canOpenURL(`${app}://`);
        if (canOpen && !this.supportedMethods.includes('upi')) {
          this.supportedMethods.push('upi');
          break;
        }
      } catch {
        console.log(`${app} not available`);
      }
    }

    console.log('Supported payment methods:', this.supportedMethods);
  }

  /**
   * Get supported payment methods
   */
  getSupportedMethods(): string[] {
    return this.supportedMethods;
  }

  /**
   * Create payment intent for course purchase
   */
  async createCoursePaymentIntent(courseId: string, amount: number, currency: string = 'INR'): Promise<PaymentIntent> {
    try {
      const response: any = await apiService.post('/payments/intents', {
        amount: amount * 100, // Convert to smallest currency unit
        currency,
        metadata: {
          courseId,
          type: 'course_purchase',
        },
      });

      return response.data.paymentIntent;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create subscription payment intent
   */
  async createSubscriptionPaymentIntent(planId: string): Promise<PaymentIntent> {
    try {
      const response: any = await apiService.post('/payments/subscriptions/create', {
        planId,
      });

      return response.data.paymentIntent;
    } catch (error) {
      console.error('Failed to create subscription payment intent:', error);
      throw new Error('Failed to create subscription payment intent');
    }
  }

  /**
   * Process card payment with Stripe
   */
  async processCardPayment(
    paymentIntent: PaymentIntent,
    _paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would use Stripe SDK when integrated
      // const { error } = await stripe.confirmPayment(paymentIntent.clientSecret!, {
      //   paymentMethodType: 'Card',
      //   paymentMethodData: {
      //     card: paymentMethod,
      //   },
      // });

      // if (error) {
      //   return { success: false, error: error.message };
      // }

      // Mock successful payment for now
      await this.confirmPaymentOnServer(paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Card payment failed:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Process UPI payment
   */
  async processUpiPayment(
    paymentIntent: PaymentIntent,
    upiId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create UPI payment URL
      const upiUrl = this.createUpiPaymentUrl(paymentIntent, upiId);
      
      // Check if UPI app can handle the URL
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (!canOpen) {
        return { success: false, error: 'No UPI app available' };
      }

      // Open UPI app
      await Linking.openURL(upiUrl);

      // Return pending status as UPI is redirected flow
      return { success: true };
    } catch (error) {
      console.error('UPI payment failed:', error);
      return { success: false, error: 'UPI payment failed' };
    }
  }

  /**
   * Process Apple Pay payment
   */
  async processApplePayPayment(paymentIntent: PaymentIntent): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Pay only available on iOS' };
    }

    try {
      // This would use Stripe Apple Pay integration
      // const { error } = await stripe.presentApplePay({
      //   cartItems: [{
      //     label: paymentIntent.metadata.courseId ? 'Course Purchase' : 'Subscription',
      //     amount: paymentIntent.amount.toString(),
      //   }],
      //   country: 'IN',
      //   currency: paymentIntent.currency,
      // });

      // if (error) {
      //   return { success: false, error: error.message };
      // }

      // await stripe.confirmApplePayPayment(paymentIntent.clientSecret!);
      
      // Mock successful payment
      await this.confirmPaymentOnServer(paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Apple Pay failed:', error);
      return { success: false, error: 'Apple Pay failed' };
    }
  }

  /**
   * Process Google Pay payment
   */
  async processGooglePayPayment(paymentIntent: PaymentIntent): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS !== 'android') {
      return { success: false, error: 'Google Pay only available on Android' };
    }

    try {
      // This would use Stripe Google Pay integration
      // const { error } = await stripe.initGooglePay({
      //   testEnv: this.paymentConfig?.googlePay.environment === 'TEST',
      //   merchantName: 'Commerce Gate',
      //   countryCode: 'IN',
      //   billingAddressConfig: {
      //     format: 'REQUIRED',
      //   },
      // });

      // if (error) {
      //   return { success: false, error: error.message };
      // }

      // const { error: presentError } = await stripe.presentGooglePay({
      //   clientSecret: paymentIntent.clientSecret!,
      //   forSetupIntent: false,
      // });

      // if (presentError) {
      //   return { success: false, error: presentError.message };
      // }

      // Mock successful payment
      await this.confirmPaymentOnServer(paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Google Pay failed:', error);
      return { success: false, error: 'Google Pay failed' };
    }
  }

  /**
   * Process payment with Razorpay
   */
  async processRazorpayPayment(
    paymentIntent: PaymentIntent,
    _options: {
      name?: string;
      email?: string;
      contact?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.paymentConfig?.razorpay.keyId) {
        throw new Error('Razorpay not configured');
      }

      // This would use Razorpay SDK
      // const razorpayOptions = {
      //   description: paymentIntent.metadata.courseId ? 'Course Purchase' : 'Subscription',
      //   image: 'https://your-logo-url.png',
      //   currency: paymentIntent.currency,
      //   key: this.paymentConfig.razorpay.keyId,
      //   amount: paymentIntent.amount,
      //   name: 'Commerce Gate',
      //   order_id: paymentIntent.id,
      //   prefill: {
      //     email: options.email,
      //     contact: options.contact,
      //     name: options.name,
      //   },
      //   theme: { color: '#3399cc' },
      // };

      // const data = await RazorpayCheckout.open(razorpayOptions);
      // console.log('Razorpay payment success:', data);

      // Confirm payment on server
      await this.confirmPaymentOnServer(paymentIntent.id);
      return { success: true };
    } catch (error) {
      console.error('Razorpay payment failed:', error);
      return { success: false, error: 'Payment failed' };
    }
  }

  /**
   * Confirm payment on server
   */
  private async confirmPaymentOnServer(paymentIntentId: string): Promise<void> {
    try {
      await apiService.post(`/payments/intents/${paymentIntentId}/confirm`);
    } catch (error) {
      console.error('Failed to confirm payment on server:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(page: number = 1, limit: number = 20): Promise<PaymentHistory[]> {
    try {
      const response: any = await apiService.get(`/payments/history?page=${page}&limit=${limit}`);
      return response.data.payments;
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  /**
   * Get saved payment methods
   */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response: any = await apiService.get('/payments/methods');
      return response.data.paymentMethods;
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    try {
      const response: any = await apiService.post('/payments/methods', paymentMethod);
      return response.data.paymentMethod;
    } catch (error) {
      console.error('Failed to save payment method:', error);
      throw error;
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiService.delete(`/payments/methods/${paymentMethodId}`);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiService.put(`/payments/methods/${paymentMethodId}/default`);
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw error;
    }
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response: any = await apiService.get('/payments/subscriptions/plans');
      return response.data.plans;
    } catch (error) {
      console.error('Failed to get subscription plans:', error);
      return [];
    }
  }

  /**
   * Get current subscription
   */
  async getCurrentSubscription(): Promise<any> {
    try {
      const response: any = await apiService.get('/payments/subscriptions/current');
      return response.data.subscription;
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      await apiService.post(`/payments/subscriptions/${subscriptionId}/cancel`, {
        reason,
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(refundRequest: RefundRequest): Promise<void> {
    try {
      await apiService.post('/payments/refunds', refundRequest);
    } catch (error) {
      console.error('Failed to request refund:', error);
      throw error;
    }
  }

  /**
   * Get receipt for payment
   */
  async getPaymentReceipt(paymentId: string): Promise<string> {
    try {
      const response: any = await apiService.get(`/payments/${paymentId}/receipt`);
      return response.data.receiptUrl;
    } catch (error) {
      console.error('Failed to get payment receipt:', error);
      throw error;
    }
  }

  /**
   * Validate UPI ID
   */
  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upiId);
  }

  /**
   * Create UPI payment URL
   */
  private createUpiPaymentUrl(paymentIntent: PaymentIntent, _upiId: string): string {
    const params = new URLSearchParams({
      pa: 'merchant@upi', // Merchant UPI ID
      pn: 'Commerce Gate',
      mc: '5734', // Merchant category code
      tr: paymentIntent.id,
      tn: paymentIntent.metadata.courseId ? 'Course Purchase' : 'Subscription',
      am: (paymentIntent.amount / 100).toString(),
      cu: paymentIntent.currency,
    });

    return `upi://pay?${params.toString()}`;
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  }

  /**
   * Show payment error alert
   */
  showPaymentError(error: string): void {
    Alert.alert(
      'Payment Failed',
      error || 'Something went wrong with your payment. Please try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show payment success alert
   */
  showPaymentSuccess(message?: string): void {
    Alert.alert(
      'Payment Successful',
      message || 'Your payment has been processed successfully!',
      [{ text: 'OK' }]
    );
  }

  /**
   * Handle payment flow
   */
  async handlePaymentFlow(
    type: 'course' | 'subscription',
    itemId: string,
    amount?: number,
    paymentMethodType: string = 'card'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create payment intent
      let paymentIntent: PaymentIntent;
      
      if (type === 'course') {
        if (!amount) throw new Error('Amount required for course purchase');
        paymentIntent = await this.createCoursePaymentIntent(itemId, amount);
      } else {
        paymentIntent = await this.createSubscriptionPaymentIntent(itemId);
      }

      // Process payment based on method type
      let result: { success: boolean; error?: string };

      switch (paymentMethodType) {
        case 'apple_pay':
          result = await this.processApplePayPayment(paymentIntent);
          break;
        case 'google_pay':
          result = await this.processGooglePayPayment(paymentIntent);
          break;
        case 'upi':
          result = await this.processUpiPayment(paymentIntent, 'user@upi');
          break;
        case 'razorpay':
          result = await this.processRazorpayPayment(paymentIntent, {});
          break;
        default:
          // Default to card payment
          const defaultMethod: PaymentMethod = {
            id: 'default',
            type: 'card',
            isDefault: true,
          };
          result = await this.processCardPayment(paymentIntent, defaultMethod);
      }

      if (result.success) {
        this.showPaymentSuccess();
      } else {
        this.showPaymentError(result.error || 'Payment failed');
      }

      return result;
    } catch (error) {
      console.error('Payment flow error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      this.showPaymentError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const paymentService = new PaymentService();