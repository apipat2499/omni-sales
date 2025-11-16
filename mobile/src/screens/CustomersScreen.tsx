import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function CustomersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customers</Text>
      <Text style={styles.subtitle}>Manage relationships</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
