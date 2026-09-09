import {
    useCallback,
    useState,
} from "react";

import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    Ionicons,
} from "@expo/vector-icons";

import {
    router,
    useFocusEffect,
} from "expo-router";

import Colors from "../constants/Colors";
import api from "../services/api";

export default function SavedScreen() {
  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function loadSaved() {
    try {
      const response =
        await api.get(
          "/users/saved"
        );

      setPosts(
        response.data.posts
      );
    } catch (error) {
      console.error(
        "Saved posts error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color={Colors.black}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Saved
        </Text>

        <View style={{ width: 25 }} />
      </View>

      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={(item) =>
          item._id
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              router.push(
                `/post/${item._id}`
              )
            }
          >
            {item.image ? (
              <Image
                source={{
                  uri: item.image,
                }}
                style={styles.image}
              />
            ) : (
              <View
                style={
                  styles.placeholder
                }
              >
                <Ionicons
                  name="play"
                  size={25}
                  color={
                    Colors.white
                  }
                />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="bookmark-outline"
              size={60}
              color={
                Colors.secondaryText
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No saved posts
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Save posts you want
              to see again.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    height: 55,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor:
      Colors.border,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
  },

  item: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 1,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    backgroundColor:
      Colors.black,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    paddingTop: 130,
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    marginTop: 8,
    color: Colors.secondaryText,
    textAlign: "center",
  },
});