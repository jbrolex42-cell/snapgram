import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "../../constants/Colors";

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Snapgram</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button}>
          <Ionicons name="heart-outline" size={27} color={Colors.black} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={26}
            color={Colors.black}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },

  logo: {
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -1,
    color: Colors.black,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  button: {
    padding: 3,
  },
});