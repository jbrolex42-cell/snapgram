import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import * as ImagePicker from "expo-image-picker";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  updateProfile,
} from "../../../services/userService";

export default function EditProfileScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [fullName, setFullName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [pronouns, setPronouns] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [avatar, setAvatar] =
    useState(null);

  const [avatarPreview, setAvatarPreview] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(
      user.fullName ||
        user.name ||
        ""
    );

    setUsername(
      user.username ||
        ""
    );

    setBio(
      user.bio ||
        ""
    );

    setWebsite(
      user.website ||
        ""
    );

    setPronouns(
      user.pronouns ||
        ""
    );

    setGender(
      user.gender ||
        ""
    );

    setAvatar(null);

    setAvatarPreview(
      user.avatar ||
        user.profilePhoto ||
        ""
    );
  }, [user]);

  const handleChangePhoto =
    useCallback(async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission required",
            "Please allow Snapgram to access your photos so you can change your profile picture."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ["images"],
              allowsEditing:
                true,
              aspect: [1, 1],
              quality: 0.9,
            }
          );

        if (
          result.canceled ||
          !result.assets?.length
        ) {
          return;
        }

        const selected =
          result.assets[0];

        setAvatar(
          selected
        );

        setAvatarPreview(
          selected.uri
        );
      } catch (error) {
        console.error(
          "[EDIT PROFILE] PHOTO PICK ERROR:",
          error
        );

        Alert.alert(
          "Couldn't change photo",
          "Please try again."
        );
      }
    }, []);

  const validateProfile =
    useCallback(() => {
      const cleanUsername =
        username
          .trim()
          .toLowerCase();

      const cleanFullName =
        fullName.trim();

      if (!cleanUsername) {
        Alert.alert(
          "Username required",
          "Please enter a username."
        );

        return false;
      }

      if (
        cleanUsername.length < 3
      ) {
        Alert.alert(
          "Invalid username",
          "Username must contain at least 3 characters."
        );

        return false;
      }

      if (
        cleanUsername.length > 30
      ) {
        Alert.alert(
          "Invalid username",
          "Username cannot contain more than 30 characters."
        );

        return false;
      }

      if (
        !/^[a-z0-9._]+$/.test(
          cleanUsername
        )
      ) {
        Alert.alert(
          "Invalid username",
          "Username can only contain letters, numbers, periods and underscores."
        );

        return false;
      }

      if (
        cleanFullName.length > 100
      ) {
        Alert.alert(
          "Name is too long",
          "Your name cannot contain more than 100 characters."
        );

        return false;
      }

      if (
        bio.length > 150
      ) {
        Alert.alert(
          "Bio is too long",
          "Your bio cannot contain more than 150 characters."
        );

        return false;
      }

      return true;
    }, [
      username,
      fullName,
      bio,
    ]);

  const handleSave =
    useCallback(async () => {
      if (saving) {
        return;
      }

      if (!validateProfile()) {
        return;
      }

      try {
        setSaving(true);

        const updatedUser =
          await updateProfile({
            fullName:
              fullName.trim(),

            username:
              username
                .trim()
                .toLowerCase(),

            bio:
              bio.trim(),

            website:
              website.trim(),

            pronouns:
              pronouns.trim(),

            gender:
              gender.trim(),

            avatar,
          });

        if (!updatedUser) {
          throw new Error(
            "The server did not return the updated profile."
          );
        }

        Alert.alert(
          "Profile updated",
          "Your profile has been updated successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } catch (error) {
        console.error(
          "[EDIT PROFILE] UPDATE ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to update your profile.";

        Alert.alert(
          "Couldn't save changes",
          message
        );
      } finally {
        setSaving(false);
      }
    }, [
      saving,
      validateProfile,
      fullName,
      username,
      bio,
      website,
      pronouns,
      gender,
      avatar,
    ]);

  if (
    authLoading &&
    !user
  ) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="small"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "bottom",
      ]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            hitSlop={12}
            style={
              styles.headerSide
            }
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color="#111"
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Edit profile
          </Text>

          <Pressable
            onPress={
              handleSave
            }
            disabled={
              saving
            }
            hitSlop={10}
            style={
              styles.headerSide
            }
          >
            {saving ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={
                  styles.doneText
                }
              >
                Done
              </Text>
            )}
          </Pressable>
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          style={
            styles.scrollView
          }
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <View
            style={
              styles.photoSection
            }
          >
            <View
              style={
                styles.avatarContainer
              }
            >
              {avatarPreview ? (
                <Image
                  source={{
                    uri: avatarPreview,
                  }}
                  style={
                    styles.avatar
                  }
                />
              ) : (
                <View
                  style={
                    styles.emptyAvatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={52}
                    color="#8e8e8e"
                  />
                </View>
              )}
            </View>

            <Pressable
              onPress={
                handleChangePhoto
              }
              style={
                styles.changePhotoButton
              }
            >
              <Text
                style={
                  styles.changePhotoText
                }
              >
                Change profile photo
              </Text>
            </Pressable>
          </View>

          {/* =================================================
              NAME
          ================================================= */}

          <ProfileField
            label="Name"
            value={fullName}
            onChangeText={
              setFullName
            }
            placeholder="Name"
            maxLength={100}
          />

          {/* =================================================
              USERNAME
          ================================================= */}

          <ProfileField
            label="Username"
            value={username}
            onChangeText={
              (value) =>
                setUsername(
                  value
                    .toLowerCase()
                    .replace(
                      /\s/g,
                      ""
                    )
                )
            }
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          {/* =================================================
              BIO
          ================================================= */}

          <View
            style={styles.field}
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Bio
            </Text>

            <TextInput
              value={bio}
              onChangeText={
                setBio
              }
              placeholder="Bio"
              placeholderTextColor="#8e8e8e"
              multiline
              maxLength={150}
              textAlignVertical="top"
              style={
                styles.bioInput
              }
            />

            <Text
              style={
                styles.characterCount
              }
            >
              {bio.length}/150
            </Text>
          </View>

          {/* =================================================
              WEBSITE
          ================================================= */}

          <ProfileField
            label="Website"
            value={website}
            onChangeText={
              setWebsite
            }
            placeholder="Website"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {/* =================================================
              PRONOUNS
          ================================================= */}

          <ProfileField
            label="Pronouns"
            value={pronouns}
            onChangeText={
              setPronouns
            }
            placeholder="Pronouns"
          />

          {/* =================================================
              GENDER
          ================================================= */}

          <ProfileField
            label="Gender"
            value={gender}
            onChangeText={
              setGender
            }
            placeholder="Gender"
          />

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <Pressable
            onPress={() =>
              router.push(
                "/settings/profile/personal-info"
              )
            }
            style={
              styles.personalInfoRow
            }
          >
            <View
              style={
                styles.personalInfoContent
              }
            >
              <Text
                style={
                  styles.personalInfoTitle
                }
              >
                Personal information settings
              </Text>

              <Text
                style={
                  styles.personalInfoSubtitle
                }
              >
                Manage your email, phone number
                and other personal details.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#8e8e8e"
            />
          </Pressable>

          {/* =================================================
              INFORMATION
          ================================================= */}

          <Text
            style={
              styles.infoText
            }
          >
            Your profile information is visible to
            people who visit your profile.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  ...props
}) {
  return (
    <View
      style={styles.field}
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#8e8e8e"
        style={
          styles.input
        }
        {...props}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#fff",
    },

    container: {
      flex: 1,
      backgroundColor: "#fff",
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: "#dbdbdb",
      paddingHorizontal: 12,
      backgroundColor: "#fff",
    },

    headerSide: {
      width: 70,
      height: 52,
      justifyContent: "center",
    },

    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "700",
      color: "#111",
    },

    doneText: {
      color: "#0095f6",
      fontSize: 15,
      fontWeight: "700",
      textAlign: "right",
    },

    scrollView: {
      flex: 1,
    },

    content: {
      paddingBottom: 50,
    },

    photoSection: {
      alignItems: "center",
      paddingTop: 28,
      paddingBottom: 28,
    },

    avatarContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      overflow: "hidden",
      backgroundColor: "#efefef",
      marginBottom: 12,
    },

    avatar: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    emptyAvatar: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#efefef",
    },

    changePhotoButton: {
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    changePhotoText: {
      color: "#0095f6",
      fontSize: 14,
      fontWeight: "600",
    },

    field: {
      paddingHorizontal: 16,
      marginBottom: 18,
    },

    fieldLabel: {
      fontSize: 13,
      color: "#737373",
      marginBottom: 6,
    },

    input: {
      minHeight: 43,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor: "#c7c7c7",
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 15,
      color: "#111",
      backgroundColor: "#fff",
    },

    bioInput: {
      minHeight: 84,
      borderWidth:
        StyleSheet.hairlineWidth,
      borderColor: "#c7c7c7",
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      color: "#111",
      backgroundColor: "#fff",
    },

    characterCount: {
      textAlign: "right",
      marginTop: 5,
      fontSize: 11,
      color: "#8e8e8e",
    },

    personalInfoRow: {
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderColor: "#dbdbdb",
    },

    personalInfoContent: {
      flex: 1,
      paddingRight: 12,
    },

    personalInfoTitle: {
      color: "#0095f6",
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 4,
    },

    personalInfoSubtitle: {
      color: "#737373",
      fontSize: 13,
      lineHeight: 18,
    },

    infoText: {
      paddingHorizontal: 16,
      paddingTop: 18,
      fontSize: 12,
      lineHeight: 17,
      color: "#8e8e8e",
    },
  });