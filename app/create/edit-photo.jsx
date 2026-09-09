import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import CropSelector from "../../components/create/CropSelector";
import FilterImage from "../../components/create/FilterImage";
import FilterSelector from "../../components/create/FilterSelector";

import {
  cropToRatio,
  rotateImage,
} from "../../services/imageEditorService";

export default function EditPhotoScreen() {
  const params =
    useLocalSearchParams();

  const initialUri =
    typeof params?.uri === "string"
      ? params.uri
      : "";

  const [uri, setUri] =
    useState(initialUri);

  const [mode, setMode] =
    useState("crop");

  const [crop, setCrop] =
    useState("original");

  const [filter, setFilter] =
    useState("Normal");

  const [processing, setProcessing] =
    useState(false);

  async function handleRotate() {
    if (!uri || processing) {
      return;
    }

    try {
      setProcessing(true);

      const newUri =
        await rotateImage(
          uri,
          90
        );

      setUri(newUri);
    } catch (error) {
      console.error(
        "ROTATE ERROR:",
        error
      );

      Alert.alert(
        "Rotate failed",
        "Unable to rotate this image."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleCrop(
    value
  ) {
    setCrop(value);

    if (
      value === "original" ||
      !uri ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      const newUri =
        await cropToRatio(
          uri,
          value
        );

      setUri(newUri);
    } catch (error) {
      console.error(
        "CROP ERROR:",
        error
      );

      Alert.alert(
        "Crop failed",
        "Unable to crop this image."
      );
    } finally {
      setProcessing(false);
    }
  }

  function continueEditing() {
    if (!uri) {
      Alert.alert(
        "No image",
        "Please select an image first."
      );

      return;
    }

    router.replace({
      pathname:
        "/create/editor",

      params: {
        media:
          JSON.stringify([
            {
              uri,
              type: "image",
              mimeType:
                "image/jpeg",
              fileName:
                `snapgram-${Date.now()}.jpg`,
            },
          ]),
      },
    });
  }

  if (!uri) {
    return (
      <View
        style={styles.empty}
      >
        <Text
          style={
            styles.emptyTitle
          }
        >
          No image selected
        </Text>

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          disabled={processing}
        >
          <Text
            style={styles.cancel}
          >
            Cancel
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          Edit photo
        </Text>

        <TouchableOpacity
          onPress={
            continueEditing
          }
          disabled={processing}
        >
          <Text
            style={[
              styles.next,
              processing &&
                styles.disabled,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* PREVIEW */}

      <View
        style={
          styles.previewContainer
        }
      >
        <FilterImage
          uri={uri}
          filter={filter}
        />

        {processing && (
          <View
            style={
              styles.processing
            }
          >
            <ActivityIndicator
              size="large"
              color="#fff"
            />

            <Text
              style={
                styles.processingText
              }
            >
              Processing...
            </Text>
          </View>
        )}
      </View>

      {/* MODE TABS */}

      <View
        style={styles.tabs}
      >
        <TouchableOpacity
          onPress={() =>
            setMode("crop")
          }
          style={styles.tab}
          disabled={processing}
        >
          <Text
            style={[
              styles.tabText,
              mode === "crop" &&
                styles.activeTab,
            ]}
          >
            Crop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setMode("filter")
          }
          style={styles.tab}
          disabled={processing}
        >
          <Text
            style={[
              styles.tabText,
              mode ===
                "filter" &&
                styles.activeTab,
            ]}
          >
            Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={
            handleRotate
          }
          style={styles.tab}
          disabled={processing}
        >
          <Text
            style={styles.tabText}
          >
            ↻
          </Text>
        </TouchableOpacity>
      </View>

      {/* TOOLS */}

      <ScrollView
        style={styles.tools}
        contentContainerStyle={
          styles.toolsContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {mode === "crop" && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Crop
            </Text>

            <CropSelector
              selected={crop}
              onSelect={
                handleCrop
              }
            />
          </>
        )}

        {mode === "filter" && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Filters
            </Text>

            <FilterSelector
              selected={filter}
              onSelect={
                setFilter
              }
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    header: {
      height: 58,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 15,
    },

    cancel: {
      fontSize: 15,
      color: "#111",
    },

    title: {
      fontSize: 17,
      fontWeight:
        "800",
      color: "#111",
    },

    next: {
      color: "#0095F6",
      fontWeight:
        "800",
      fontSize: 15,
    },

    disabled: {
      opacity: 0.4,
    },

    previewContainer: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor:
        "#111",
      position:
        "relative",
    },

    processing: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    processingText: {
      marginTop: 10,
      color: "#fff",
      fontSize: 14,
      fontWeight:
        "600",
    },

    tabs: {
      height: 55,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    tab: {
      flex: 1,
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    tabText: {
      color: "#777",
      fontSize: 13,
      fontWeight:
        "600",
    },

    activeTab: {
      color: "#000",
      fontWeight:
        "800",
    },

    tools: {
      flex: 1,
    },

    toolsContent: {
      paddingBottom: 40,
    },

    sectionTitle: {
      paddingHorizontal:
        15,
      paddingTop: 15,
      fontSize: 16,
      fontWeight:
        "800",
      color: "#111",
    },

    empty: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#fff",
      padding: 30,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight:
        "800",
      marginBottom: 20,
    },

    backButton: {
      backgroundColor:
        "#0095F6",
      paddingHorizontal:
        20,
      paddingVertical:
        12,
      borderRadius: 8,
    },

    backButtonText: {
      color: "#fff",
      fontWeight:
        "700",
    },
  });