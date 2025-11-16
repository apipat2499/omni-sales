import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { BottomTabNavigator } from "./src/navigation/BottomTabNavigator";
import { RootStackNavigator } from "./src/navigation/RootStackNavigator";
import { useAuthStore } from "./src/store/authStore";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { user, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initializeAuth();
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
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        {user ? <BottomTabNavigator /> : <RootStackNavigator />}
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
