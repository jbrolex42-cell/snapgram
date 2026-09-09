import React, {
  useEffect,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

export default function StoryCameraScreen() {
  useEffect(() => {
    router.replace({
      pathname: "/create/camera",
      params: {
        mode: "story",
      },
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color="#fff"
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
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    marginTop: 14,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});