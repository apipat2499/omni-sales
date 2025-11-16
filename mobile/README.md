# Omni Sales Mobile App

A comprehensive React Native mobile application for managing sales, orders, products, and customers, built with Expo and TypeScript.

## Features

### Core Features
- **Authentication**
  - Email/Password login
  - Two-Factor Authentication (2FA)
  - Biometric authentication (Face ID / Fingerprint)
  - Secure token management

- **Dashboard**
  - Sales analytics and charts
  - Quick stats overview
  - Recent orders
  - Revenue trends

- **Orders Management**
  - View all orders
  - Order details with full information
  - Order status tracking
  - Search and filter

- **Products Management**
  - Product listing with search
  - Product detail views
  - Stock information
  - QR code / Barcode scanning
  - Product photography

- **Customers Management**
  - Customer listing
  - Customer profiles
  - Purchase history
  - Loyalty points

- **Advanced Features**
  - QR code scanning for products/orders
  - Camera integration for product photos
  - Push notifications
  - Offline mode with data caching
  - Deep linking support
  - Dark mode support

## Tech Stack

- **Framework**: React Native (Expo ~51.0.0)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper
- **State Management**: Zustand
- **HTTP Client**: Axios with custom wrapper
- **Storage**: AsyncStorage + Expo SecureStore
- **Testing**: Jest + Detox
- **Forms**: React Hook Form + Zod

## Project Structure

```
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── TextInput.tsx
│   │   └── ...
│   ├── screens/           # App screens
│   │   ├── auth/         # Authentication screens
│   │   ├── DashboardScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   └── ...
│   ├── navigation/        # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── BottomTabNavigator.tsx
│   │   ├── RootStackNavigator.tsx
│   │   └── LinkingConfiguration.ts
│   ├── services/          # Business logic & API services
│   │   ├── authService.ts
│   │   ├── biometricService.ts
│   │   ├── notificationService.ts
│   │   └── offlineService.ts
│   ├── lib/              # Utilities & helpers
│   │   └── api/
│   │       ├── client.ts
│   │       └── endpoints.ts
│   ├── store/            # State management
│   │   └── authStore.ts
│   └── types/            # TypeScript type definitions
│       ├── index.ts
│       └── env.d.ts
├── __tests__/            # Unit tests
├── e2e/                  # E2E tests
├── app.json              # Expo configuration
├── eas.json              # Expo Application Services config
├── babel.config.js       # Babel configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode and CocoaPods
- For Android: Android Studio and Android SDK
- EAS CLI for building (`npm install -g eas-cli`)

### Installation

1. **Clone the repository and navigate to mobile directory**
   ```bash
   cd omni-sales/mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   API_URL=http://localhost:3000
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-key
   FIREBASE_API_KEY=your-firebase-key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires built app)
npm run test:e2e

# Test coverage
npm test -- --coverage
```

### Building

#### Development Build
```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

#### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Deployment

#### TestFlight (iOS)
```bash
eas submit --platform ios
```

#### Google Play (Android)
```bash
eas submit --platform android
```

## Features Implementation

### Authentication Flow

1. **Login Screen**
   - Email/password authentication
   - Biometric login option (if enabled)
   - Remember me functionality
   - Password recovery link

2. **2FA Screen**
   - 6-digit code verification
   - Code resend functionality
   - Fallback to password

3. **Biometric Setup**
   - Available in Settings
   - Uses Face ID / Touch ID / Fingerprint
   - Secure token storage with Expo SecureStore

### Offline Mode

The app supports offline functionality:

- **Caching**: API responses cached with TTL
- **Offline Queue**: Failed requests queued for retry
- **AsyncStorage**: Local data persistence
- **Network Detection**: Automatic retry when online

### Push Notifications

Configured with Expo Notifications:

- **Setup**: Auto-registration on app start
- **Handling**: Background and foreground notifications
- **Deep Links**: Navigate to specific screens from notifications

### QR Code Scanning

Features:
- Product barcode scanning
- Order QR code scanning
- Custom scan overlay
- Flash/torch support
- Gallery import option

### Camera Integration

Features:
- Product photo capture
- Front/back camera toggle
- Photo preview and retake
- Gallery integration
- Image optimization

## Deep Linking

The app supports deep linking with the following schema:

```
omnisales://dashboard
omnisales://orders
omnisales://orders/:orderId
omnisales://products/:productId
omnisales://scanner
omnisales://camera
```

## API Integration

The app integrates with the backend API:

- **Base URL**: Configured via `API_URL` environment variable
- **Authentication**: Bearer token in headers
- **Error Handling**: Normalized error responses
- **Retry Logic**: Automatic retry on network failures
- **Caching**: TTL-based response caching

## Security

- **Secure Storage**: Sensitive data stored with Expo SecureStore
- **Token Management**: Automatic token refresh
- **Biometric Auth**: Hardware-backed authentication
- **HTTPS**: All API calls over HTTPS
- **Input Validation**: Zod schema validation

## Performance

- **Lazy Loading**: Screens loaded on demand
- **Image Optimization**: Compressed images
- **Memoization**: React.memo for expensive components
- **Virtualized Lists**: FlatList for large datasets
- **Bundle Size**: Optimized with Metro bundler

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start -c
   ```

2. **iOS build fails**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build fails**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **Environment variables not loading**
   - Ensure `.env` file exists
   - Restart Metro bundler

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved
