import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'omnisales://'],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Orders: 'orders',
          Products: 'products',
          Customers: 'customers',
          Profile: 'profile',
        },
      },
      OrderDetail: 'orders/:orderId',
      ProductDetail: 'products/:productId',
      QRScanner: 'scanner',
      Camera: 'camera',
      Settings: 'settings',
      Login: 'login',
      Signup: 'signup',
      TwoFactor: 'verify',
    },
  },
};
