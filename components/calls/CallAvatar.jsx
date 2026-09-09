import {
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function CallAvatar({
  username,
  avatar,
}) {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            avatar ||
            "https://via.placeholder.com/150",
        }}
        style={styles.avatar}
      />

      <Text style={styles.username}>
        {username}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eee",
  },

  username: {
    marginTop: 15,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});