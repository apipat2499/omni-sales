import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";
import { TwoFactorScreen } from "../screens/auth/TwoFactorScreen";

const Stack = createNativeStackNavigator();

export function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: "Create Account" }}
      />
      <Stack.Screen
        name="TwoFactor"
        component={TwoFactorScreen}
        options={{ title: "Verify Code" }}
      />
    </Stack.Navigator>
  );
}
