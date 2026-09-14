import React, { useEffect, useRef } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

export default function StoryCameraScreen() {
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;

    const timer = setTimeout(() => {
      router.replace({
        pathname: "/create/camera",
        params: {
          mode: "story",
        },
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color="#ffffff"
      />

      <Text style={styles.text}>
        Opening camera...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    marginTop: 14,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});