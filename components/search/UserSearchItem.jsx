
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    router,
} from "expo-router";

export default function UserSearchItem({
  user,
}) {
  function openProfile() {
    router.push(
      `/profile/${user._id}`
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={openProfile}
    >
      <View style={styles.avatar}>
        {user.avatar ? (
          <Image
            source={{
              uri: user.avatar,
            }}
            style={styles.image}
          />
        ) : (
          <Text style={styles.initial}>
            {user.username
              ?.charAt(0)
              ?.toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.username}>
          {user.username}
        </Text>

        {user.name && (
          <Text style={styles.name}>
            {user.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 9,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  initial: {
    fontSize: 18,
    fontWeight: "800",
  },

  info: {
    marginLeft: 12,
  },

  username: {
    fontWeight: "800",
    fontSize: 15,
  },

  name: {
    color: "#777",
    marginTop: 2,
  },
});