
import {
    StyleSheet,
    View,
} from "react-native";

export default function StoryProgress({
  count,
  current,
  progress,
}) {
  return (
    <View style={styles.container}>
      {Array.from({
        length: count,
      }).map((_, index) => {
        let width = "0%";

        if (index < current) {
          width = "100%";
        }

        if (index === current) {
          width = `${progress * 100}%`;
        }

        return (
          <View
            key={index}
            style={styles.track}
          >
            <View
              style={[
                styles.progress,
                {
                  width,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 10,
    right: 10,
    zIndex: 20,
    flexDirection: "row",
    gap: 4,
  },

  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: "#fff",
  },
});