import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider } from 'react-native-paper';
import { AppNavigator } from "./src/navigation/AppNavigator";
import { RootStackNavigator } from "./src/navigation/RootStackNavigator";
import { linking } from "./src/navigation/LinkingConfiguration";
import { useAuthStore } from "./src/store/authStore";
import { notificationService } from "./src/services/notificationService";
import { offlineService } from "./src/services/offlineService";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { user, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initializeAuth();
        await notificationService.initialize();
        await offlineService.initialize();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    bootstrap();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer linking={linking}>
          {user ? <AppNavigator /> : <RootStackNavigator />}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
