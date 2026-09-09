
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function AdjustmentSlider({
  label,
  value,
  onChange,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {Math.round(value)}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.progress,
            {
              width: `${((value + 100) / 200) * 100}%`,
            },
          ]}
        />

        <View
          style={[
            styles.thumb,
            {
              left: `${((value + 100) / 200) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
  },

  value: {
    color: "#777",
  },

  track: {
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 5,
    position: "relative",
  },

  progress: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 5,
    backgroundColor: "#111",
    borderRadius: 5,
  },

  thumb: {
    position: "absolute",
    top: -6,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#111",
    marginLeft: -8,
  },
});