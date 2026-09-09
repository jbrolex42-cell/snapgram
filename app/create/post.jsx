import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";

import Colors from "../../constants/Colors";
import { createPost } from "../../services/postService";

export default function CreatePostScreen() {
  const params = useLocalSearchParams();

  const uri = params.uri;

  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleShare() {
    if (!uri) {
      Alert.alert(
        "Media required",
        "Please select a photo first."
      );

      return;
    }

    setPosting(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 800)
    );

    setPosting(false);

    Alert.alert(
      "Posted",
      "Your post has been created.",
      [
        {
          text: "OK",
          onPress: () =>
            router.replace("/(tabs)"),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
          >
            <Ionicons
              name="close"
              size={29}
              color={Colors.black}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            New post
          </Text>

          <TouchableOpacity
            onPress={handleShare}
            disabled={posting}
          >
            <Text
              style={[
                styles.share,
                posting && styles.disabled,
              ]}
            >
              {posting ? "Posting..." : "Share"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.preview}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.image}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="image-outline"
                size={60}
                color={Colors.secondaryText}
              />

              <Text style={styles.emptyText}>
                Select an image
              </Text>
            </View>
          )}
        </View>

        <View style={styles.captionContainer}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor={
              Colors.secondaryText
            }
            multiline
            style={styles.caption}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  keyboard: {
    flex: 1,
  },

  header: {
    height: 55,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
  },

  share: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  disabled: {
    opacity: 0.5,
  },

  preview: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    marginTop: 10,
    color: Colors.secondaryText,
  },

  captionContainer: {
    padding: 15,
  },

  caption: {
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
});
async function handleShare() {
  if (!uri) {
    Alert.alert(
      "Media required",
      "Please select a photo first."
    );

    return;
  }

  try {
    setPosting(true);

    await createPost({
      uri,
      caption,
      type: params.type || "image",
    });

    Alert.alert(
      "Posted",
      "Your post has been shared successfully.",
      [
        {
          text: "OK",
          onPress: () =>
            router.replace("/(tabs)"),
        },
      ]
    );
  } catch (error) {
    console.error(error);

    Alert.alert(
      "Upload failed",
      error.response?.data?.message ||
        "Unable to upload your post."
    );
  } finally {
    setPosting(false);
  }
}
<TouchableOpacity
  onPress={() =>
    onComments?.(post._id)
  }
>
  <Ionicons
    name="chatbubble-outline"
    size={25}
    color={Colors.black}
  />
</TouchableOpacity>