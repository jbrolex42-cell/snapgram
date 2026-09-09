
import {
    Image,
    StyleSheet,
    View,
} from "react-native";

export default function FilterImage({
  uri,
  filter = "Normal",
}) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="contain"
      />

      {filter !== "Normal" && (
        <View
          pointerEvents="none"
          style={[
            styles.overlay,
            getFilterStyle(filter),
          ]}
        />
      )}
    </View>
  );
}

function getFilterStyle(filter) {
  switch (filter) {
    case "Clarendon":
      return {
        backgroundColor:
          "rgba(80,120,255,0.12)",
      };

    case "Gingham":
      return {
        backgroundColor:
          "rgba(180,150,170,0.16)",
      };

    case "Moon":
      return {
        backgroundColor:
          "rgba(80,80,80,0.35)",
      };

    case "Lark":
      return {
        backgroundColor:
          "rgba(255,220,170,0.10)",
      };

    case "Juno":
      return {
        backgroundColor:
          "rgba(255,100,70,0.12)",
      };

    case "Valencia":
      return {
        backgroundColor:
          "rgba(230,180,100,0.18)",
      };

    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});