# Quiz App - React Native

A comprehensive mobile quiz application built with React Native, TypeScript, and Redux Toolkit. This app provides an engaging learning platform with multiple test formats, offline capabilities, and social features.

## 🚀 Features

### Core Features
- **Multiple Test Formats**: MCQ, True/False, Match, Categorize, and Arrange questions
- **Offline Mode**: Download tests and take them offline with automatic sync
- **Course Management**: Browse courses, track progress, and manage enrollments
- **User Authentication**: Secure login/register with biometric authentication support
- **Real-time Analytics**: Track performance, view detailed test results and statistics
- **Social Features**: Forums, groups, leaderboards, and user profiles

### Technical Features
- **Redux State Management**: Centralized state with Redux Toolkit
- **Offline-First Architecture**: AsyncStorage for local data persistence
- **Push Notifications**: Firebase Cloud Messaging integration
- **Payment Gateway**: Razorpay integration for course purchases
- **Network Optimization**: Smart caching and adaptive loading
- **Error Handling**: Comprehensive error boundaries and recovery

## 📱 Screenshots & Demo

[Add your app screenshots here]

## 🛠️ Tech Stack

- **Framework**: React Native 0.82
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Storage**: AsyncStorage, SQLite
- **Notifications**: Firebase Cloud Messaging
- **Authentication**: JWT + Biometric
- **Payment**: Razorpay
- **Testing**: Jest + React Native Testing Library

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or Yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- JDK 11 or higher

Complete the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide for detailed instructions.

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Shrijeetsd/quiz_app.git
cd quiz_app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Install iOS dependencies (macOS only)

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

## 🏃 Running the App

### Start Metro Bundler

```bash
npm start
# or
yarn start
```

### Run on Android

```bash
npm run android
# or
yarn android
```

### Run on iOS (macOS only)

```bash
npm run ios
# or
yarn ios
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## 📁 Project Structure

```
quiz_app/
├── src/
│   ├── components/       # Reusable components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and business logic
│   ├── store/           # Redux store and slices
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # App constants and colors
│   └── hooks/           # Custom React hooks
├── android/             # Android native code
├── ios/                 # iOS native code
└── __tests__/          # Test files
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-api-url.com
RAZORPAY_KEY=your_razorpay_key
FIREBASE_API_KEY=your_firebase_key
```

### Firebase Setup

1. Create a Firebase project
2. Add Android/iOS apps to Firebase
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Place them in respective folders

## 📦 Build for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at: `android/app/build/outputs/apk/release/`

### iOS

```bash
cd ios
xcodebuild -workspace CommerceGateApp.xcworkspace -scheme CommerceGateApp -configuration Release
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Author

**Shrijeet**
- GitHub: [@Shrijeetsd](https://github.com/Shrijeetsd)

## 🙏 Acknowledgments

- React Native Community
- Redux Toolkit Team
- All contributors and supporters

## 📞 Support

For support, email shrijeetsd@gmail.com or create an issue in this repository.

---

Made with ❤️ using React Native

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
