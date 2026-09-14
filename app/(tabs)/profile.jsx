import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../context/AuthContext";

import { updateProfile } from "../../services/userService";

import {
  getUserPosts,
  getUserReels,
  getUserReposts,
  getTaggedPosts,
} from "../../services/postService";

import {
  getStories,
  getUserStories,
} from "../../services/storyService";

import {
  getHighlights,
  createHighlight,
} from "../../services/highlightService";

import VerifiedBadge from "../../components/common/VerifiedBadge";
import ProfileGrid from "../../components/profile/ProfileGrid";

const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  gray: "#737373",
  muted: "#8E8E8E",
  lightGray: "#EFEFEF",
  border: "#DBDBDB",
  blue: "#0095F6",
  danger: "#ED4956",
};

const TABS = [
  {
    key: "posts",
    icon: "grid-outline",
    label: "Posts",
  },
  {
    key: "reels",
    icon: "play-outline",
    label: "Reels",
  },
  {
    key: "reposts",
    icon: "repeat-outline",
    label: "Reposts",
  },
  {
    key: "tagged",
    icon: "person-outline",
    label: "Tagged",
  },
];

function getId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?._id ||
    value?.id ||
    value?.userId ||
    null
  );
}

function getImageUri(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.url ||
    value?.uri ||
    value?.secure_url ||
    value?.secureUrl ||
    value?.src ||
    value?.image ||
    value?.imageUrl ||
    value?.mediaUrl ||
    null
  );
}

function getProfileAvatar(user) {
  if (!user) {
    return null;
  }

  return (
    getImageUri(user.avatar) ||
    getImageUri(user.profilePicture) ||
    getImageUri(user.profileImage) ||
    getImageUri(user.photo) ||
    null
  );
}

function getUsername(user) {
  return (
    user?.username ||
    user?.handle ||
    "username"
  );
}

function getDisplayName(user) {
  return (
    user?.fullName ||
    user?.name ||
    user?.displayName ||
    user?.username ||
    "User"
  );
}

function formatCount(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  if (number < 1000) {
    return String(number);
  }

  if (number < 1000000) {
    const result = number / 1000;

    return `${result % 1 === 0 ? result : result.toFixed(1)}K`;
  }

  const result = number / 1000000;

  return `${result % 1 === 0 ? result : result.toFixed(1)}M`;
}

function normalizeWebsite(value) {
  if (!value) {
    return null;
  }

  const clean = String(value).trim();

  if (!clean) {
    return null;
  }

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://")
  ) {
    return clean;
  }

  return `https://${clean}`;
}

function normalizeArray(response, key) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    key &&
    Array.isArray(response?.[key])
  ) {
    return response[key];
  }

  if (
    key &&
    Array.isArray(response?.data?.[key])
  ) {
    return response.data[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getStoryImage(story) {
  return (
    getImageUri(story?.media) ||
    getImageUri(story?.image) ||
    getImageUri(story?.mediaUrl) ||
    getImageUri(story?.url)
  );
}

function getHighlightCover(highlight) {
  return (
    getImageUri(highlight?.cover) ||
    getImageUri(highlight?.coverImage) ||
    getImageUri(highlight?.image) ||
    getImageUri(highlight?.coverUrl)
  );
}

export default function ProfileScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] =
    useState("posts");

  const [refreshing, setRefreshing] =
    useState(false);

  const [profilePosts, setProfilePosts] =
    useState([]);

  const [profileReels, setProfileReels] =
    useState([]);

  const [profileReposts, setProfileReposts] =
    useState([]);

  const [profileTagged, setProfileTagged] =
    useState([]);

  const [postsLoading, setPostsLoading] =
    useState(false);

  const [reelsLoading, setReelsLoading] =
    useState(false);

  const [repostsLoading, setRepostsLoading] =
    useState(false);

  const [taggedLoading, setTaggedLoading] =
    useState(false);

  const [highlights, setHighlights] =
    useState([]);

  const [highlightsLoading, setHighlightsLoading] =
    useState(false);

  const [myStories, setMyStories] =
    useState([]);

  const [storiesLoading, setStoriesLoading] =
    useState(false);

  const [menuVisible, setMenuVisible] =
    useState(false);

  const [editVisible, setEditVisible] =
    useState(false);

  const [highlightVisible, setHighlightVisible] =
    useState(false);

  const [selectedStories, setSelectedStories] =
    useState([]);

  const [highlightName, setHighlightName] =
    useState("");

  const [creatingHighlight, setCreatingHighlight] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [name, setName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [pronouns, setPronouns] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [selectedAvatar, setSelectedAvatar] =
    useState(null);

  const [savingProfile, setSavingProfile] =
    useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setUsername(
      user?.username || ""
    );

    setName(
      user?.fullName ||
        user?.name ||
        user?.displayName ||
        ""
    );

    setBio(
      user?.bio || ""
    );

    setWebsite(
      user?.website ||
        user?.link ||
        ""
    );

    setPronouns(
      user?.pronouns || ""
    );

    setGender(
      user?.gender || ""
    );

    setSelectedAvatar(
      getProfileAvatar(user)
    );
  }, [user]);

  const loadProfilePosts =
    useCallback(async () => {
      if (!user) {
        setProfilePosts([]);
        return [];
      }

      try {
        setPostsLoading(true);

        const response =
          await getUserPosts(1, 50);

        const posts = normalizeArray(
          response,
          "posts"
        );

        setProfilePosts(posts);

        return posts;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD POSTS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setProfilePosts([]);

        return [];
      } finally {
        setPostsLoading(false);
      }
    }, [user]);

  const loadProfileReels =
    useCallback(async () => {
      if (!user) {
        setProfileReels([]);
        return [];
      }

      try {
        setReelsLoading(true);

        const response =
          await getUserReels(1, 50);

        const reels = normalizeArray(
          response,
          "reels"
        );

        setProfileReels(reels);

        return reels;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD REELS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setProfileReels([]);

        return [];
      } finally {
        setReelsLoading(false);
      }
    }, [user]);

  const loadProfileReposts =
    useCallback(async () => {
      if (!user) {
        setProfileReposts([]);
        return [];
      }

      try {
        setRepostsLoading(true);

        const response =
          await getUserReposts(1, 50);

        const reposts = normalizeArray(
          response,
          "reposts"
        );

        setProfileReposts(reposts);

        return reposts;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD REPOSTS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setProfileReposts([]);

        return [];
      } finally {
        setRepostsLoading(false);
      }
    }, [user]);

  const loadProfileTagged =
    useCallback(async () => {
      if (!user) {
        setProfileTagged([]);
        return [];
      }

      try {
        setTaggedLoading(true);

        const response =
          await getTaggedPosts(1, 50);

        const tagged = normalizeArray(
          response,
          "posts"
        );

        setProfileTagged(tagged);

        return tagged;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD TAGGED ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setProfileTagged([]);

        return [];
      } finally {
        setTaggedLoading(false);
      }
    }, [user]);

  const loadHighlights =
    useCallback(async () => {
      if (!user) {
        setHighlights([]);
        return [];
      }

      const userId = getId(user);

      if (!userId) {
        setHighlights([]);
        return [];
      }

      try {
        setHighlightsLoading(true);

        const response =
          await getHighlights(userId);

        const data =
          normalizeArray(
            response,
            "highlights"
          );

        const mine = data.filter(
          (highlight) => {
            if (!highlight?.user) {
              return true;
            }

            const highlightUserId =
              getId(highlight.user);

            return (
              !highlightUserId ||
              highlightUserId === userId
            );
          }
        );

        setHighlights(mine);

        return mine;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD HIGHLIGHTS ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setHighlights([]);

        return [];
      } finally {
        setHighlightsLoading(false);
      }
    }, [user]);

  const loadMyStories =
    useCallback(async () => {
      if (!user) {
        setMyStories([]);
        return [];
      }

      const userId = getId(user);

      if (!userId) {
        setMyStories([]);
        return [];
      }

      try {
        setStoriesLoading(true);

        let response;

        if (typeof getUserStories === "function") {
          response =
            await getUserStories(userId);
        } else {
          response =
            await getStories();
        }

        const stories =
          normalizeArray(
            response,
            "stories"
          );

        const mine = stories.filter(
          (story) => {
            const storyUserId =
              getId(story?.user) ||
              story?.userId ||
              getId(story?.author);

            if (!storyUserId) {
              return true;
            }

            return (
              String(storyUserId) ===
              String(userId)
            );
          }
        );

        setMyStories(mine);

        return mine;
      } catch (error) {
        console.error(
          "[PROFILE] LOAD STORIES ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setMyStories([]);

        return [];
      } finally {
        setStoriesLoading(false);
      }
    }, [user]);

  const loadProfile =
    useCallback(async () => {
      if (!user) {
        return;
      }

      await Promise.allSettled([
        loadProfilePosts(),
        loadProfileReels(),
        loadProfileReposts(),
        loadProfileTagged(),
        loadHighlights(),
      ]);
    }, [
      user,
      loadProfilePosts,
      loadProfileReels,
      loadProfileReposts,
      loadProfileTagged,
      loadHighlights,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleRefresh =
    useCallback(async () => {
      if (!user) {
        return;
      }

      try {
        setRefreshing(true);

        await Promise.allSettled([
          loadProfilePosts(),
          loadProfileReels(),
          loadProfileReposts(),
          loadProfileTagged(),
          loadHighlights(),
        ]);
      } finally {
        setRefreshing(false);
      }
    }, [
      user,
      loadProfilePosts,
      loadProfileReels,
      loadProfileReposts,
      loadProfileTagged,
      loadHighlights,
    ]);

  const getVisiblePosts = () => {
    switch (activeTab) {
      case "reels":
        return profileReels;

      case "reposts":
        return profileReposts;

      case "tagged":
        return profileTagged;

      case "posts":
      default:
        return profilePosts;
    }
  };

  const visiblePosts =
    getVisiblePosts();

  const currentTabLoading =
    activeTab === "posts"
      ? postsLoading
      : activeTab === "reels"
      ? reelsLoading
      : activeTab === "reposts"
      ? repostsLoading
      : taggedLoading;

  const postsCount =
    user?.postsCount ??
    user?.postCount ??
    profilePosts.length;

  const followersCount =
    user?.followersCount ??
    user?.followers?.length ??
    0;

  const followingCount =
    user?.followingCount ??
    user?.following?.length ??
    0;

  const openCreatePost = () => {
    router.push(
      "/(tabs)/create"
    );
  };

  const openSettings = () => {
    setMenuVisible(false);

    router.push(
      "/settings"
    );
  };

  const openActivity = () => {
    setMenuVisible(false);

    router.push(
      "/settings/activity/activity"
    );
  };

  const openArchive = () => {
    setMenuVisible(false);

    router.push(
      "/settings/activity/archived"
    );
  };

  const openSaved = () => {
    setMenuVisible(false);

    router.push(
      "/saved"
    );
  };

  const openCloseFriends = () => {
    setMenuVisible(false);

    router.push(
      "/settings/privacy/close-friends"
    );
  };

  const openFollowers = () => {
    const userId = getId(user);

    if (!userId) {
      return;
    }

    router.push({
      pathname:
        "/profile/followers",
      params: {
        userId: String(userId),
      },
    });
  };

  const openFollowing = () => {
    const userId = getId(user);

    if (!userId) {
      return;
    }

    router.push({
      pathname:
        "/profile/following",
      params: {
        userId: String(userId),
      },
    });
  };

  const openShareProfile =
    async () => {
      try {
        const currentUsername =
          getUsername(user);

        const profileUrl =
          `https://snapgram.app/${currentUsername}`;

        await Share.share({
          message:
            `Check out @${currentUsername} on Snapgram\n${profileUrl}`,
        });
      } catch (error) {
        console.error(
          "[PROFILE] SHARE ERROR:",
          error
        );
      }
    };

  const websiteValue =
    user?.website ||
    user?.link ||
    website;

  const openWebsite =
    async () => {
      const url =
        normalizeWebsite(
          websiteValue
        );

      if (!url) {
        return;
      }

      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert(
          "Unable to open link",
          "This website could not be opened."
        );
      }
    };

  const openThreads = () => {
    Alert.alert(
      "Threads",
      "Threads integration is not connected yet."
    );
  };

  const pickAvatar =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Photo access needed",
            "Allow photo access to change your profile picture."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
              ],
              allowsEditing: true,
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

        setSelectedAvatar(
          result.assets[0].uri
        );
      } catch (error) {
        console.error(
          "[PROFILE] AVATAR PICKER ERROR:",
          error
        );

        Alert.alert(
          "Couldn't select photo",
          "Please try again."
        );
      }
    };

  const saveProfile =
    async () => {
      const cleanUsername =
        username
          .trim()
          .toLowerCase();

      const cleanName =
        name.trim();

      const cleanBio =
        bio.trim();

      const cleanWebsite =
        website.trim();

      const cleanPronouns =
        pronouns.trim();

      const cleanGender =
        gender.trim();

      if (
        cleanUsername.length < 3
      ) {
        Alert.alert(
          "Invalid username",
          "Username must contain at least 3 characters."
        );

        return;
      }

      try {
        setSavingProfile(true);

        const payload = {
          username:
            cleanUsername,
          fullName:
            cleanName,
          bio:
            cleanBio,
          website:
            cleanWebsite,
          pronouns:
            cleanPronouns,
          gender:
            cleanGender,
          avatar:
            selectedAvatar,
        };

        const response =
          await updateProfile(
            payload
          );

        const updatedUser =
          response?.user ||
          response?.data?.user ||
          response?.data ||
          response;

        setUsername(
          updatedUser?.username ||
            cleanUsername
        );

        setName(
          updatedUser?.fullName ||
            updatedUser?.name ||
            cleanName
        );

        setBio(
          updatedUser?.bio ??
            cleanBio
        );

        setWebsite(
          updatedUser?.website ??
            cleanWebsite
        );

        setPronouns(
          updatedUser?.pronouns ??
            cleanPronouns
        );

        setGender(
          updatedUser?.gender ??
            cleanGender
        );

        const updatedAvatar =
          getProfileAvatar(
            updatedUser
          );

        if (updatedAvatar) {
          setSelectedAvatar(
            updatedAvatar
          );
        }

        setEditVisible(false);

        await loadProfilePosts();
      } catch (error) {
        console.error(
          "[PROFILE] SAVE PROFILE ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        Alert.alert(
          "Couldn't save profile",
          getErrorMessage(
            error,
            "Please try again."
          )
        );
      } finally {
        setSavingProfile(false);
      }
    };

  const openCreateHighlight =
    async () => {
      setSelectedStories([]);
      setHighlightName("");

      const stories =
        await loadMyStories();

      if (!stories.length) {
        Alert.alert(
          "No stories available",
          "Post a Story first, then you can add it to a Highlight."
        );

        return;
      }

      setHighlightVisible(true);
    };

  const toggleStorySelection =
    (storyId) => {
      if (!storyId) {
        return;
      }

      setSelectedStories(
        (current) => {
          if (
            current.includes(
              storyId
            )
          ) {
            return current.filter(
              (id) =>
                id !== storyId
            );
          }

          return [
            ...current,
            storyId,
          ];
        }
      );
    };

  const saveHighlight =
    async () => {
      if (
        !selectedStories.length
      ) {
        Alert.alert(
          "Select a Story",
          "Choose at least one Story."
        );

        return;
      }

      try {
        setCreatingHighlight(
          true
        );

        const response =
          await createHighlight({
            title:
              highlightName.trim() ||
              "Highlights",
            storyIds:
              selectedStories,
          });

        const created =
          response?.highlight ||
          response?.data?.highlight ||
          response?.data ||
          response;

        if (created) {
          setHighlights(
            (current) => [
              created,
              ...current,
            ]
          );
        } else {
          await loadHighlights();
        }

        setHighlightVisible(
          false
        );

        setSelectedStories([]);
        setHighlightName("");
      } catch (error) {
        console.error(
          "[PROFILE] CREATE HIGHLIGHT ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        Alert.alert(
          "Couldn't create Highlight",
          getErrorMessage(
            error,
            "Please try again."
          )
        );
      } finally {
        setCreatingHighlight(
          false
        );
      }
    };

  const openHighlight =
    (highlight) => {
      const highlightId =
        getId(highlight);

      if (!highlightId) {
        return;
      }

      router.push(
        `/stories/${highlightId}`
      );
    };

  if (authLoading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
        edges={["top"]}
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
        edges={["top"]}
      >
        <Text
          style={
            styles.loadingText
          }
        >
          Profile unavailable
        </Text>
      </SafeAreaView>
    );
  }

  const avatarUri =
    getProfileAvatar(user);

  const displayUsername =
    getUsername(user);

  const displayName =
    getDisplayName(user);

  const musicTitle =
    user?.profileMusic?.title ||
    user?.music?.title ||
    null;

  const musicArtist =
    user?.profileMusic?.artist ||
    user?.music?.artist ||
    null;

  const isPrivate =
    Boolean(
      user?.isPrivate
    );

  const isVerified =
    Boolean(
      user?.isVerified ||
        user?.verified ||
        user?.verification
          ?.isVerified ||
        user?.verification
          ?.verified
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View
        style={styles.screen}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              tintColor={
                COLORS.black
              }
            />
          }
        >

          <View
            style={styles.header}
          >
            <TouchableOpacity
              style={
                styles.headerIcon
              }
              onPress={
                openCreatePost
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-outline"
                size={31}
                color={
                  COLORS.black
                }
              />
            </TouchableOpacity>

            <View
              style={
                styles.usernameHeader
              }
            >
              {isPrivate && (
                <Ionicons
                  name="lock-closed"
                  size={15}
                  color={
                    COLORS.black
                  }
                  style={
                    styles.lockIcon
                  }
                />
              )}

              <Text
                style={
                  styles.headerUsername
                }
                numberOfLines={1}
              >
                {displayUsername}
              </Text>

              <Ionicons
                name="chevron-down"
                size={17}
                color={
                  COLORS.black
                }
              />
            </View>

            <View
              style={
                styles.headerRight
              }
            >
              <TouchableOpacity
                style={
                  styles.headerIcon
                }
                onPress={
                  openThreads
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="at-outline"
                  size={28}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.headerIcon
                }
                onPress={() =>
                  setMenuVisible(
                    true
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="menu-outline"
                  size={31}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={
              styles.profileSection
            }
          >
            <View
              style={
                styles.topProfileRow
              }
            >

              <View
                style={
                  styles.avatarWrapper
                }
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setEditVisible(
                      true
                    )
                  }
                >
                  {avatarUri ? (
                    <Image
                      source={{
                        uri: avatarUri,
                      }}
                      style={
                        styles.avatar
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={44}
                        color={
                          COLORS.gray
                        }
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.addStoryButton
                  }
                  onPress={
                    openCreatePost
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color={
                      COLORS.white
                    }
                  />
                </TouchableOpacity>
              </View>

              <View
                style={
                  styles.statsRow
                }
              >
                <Stat
                  value={formatCount(
                    postsCount
                  )}
                  label="posts"
                />

                <TouchableOpacity
                  style={
                    styles.stat
                  }
                  onPress={
                    openFollowers
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    {formatCount(
                      followersCount
                    )}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    followers
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.stat
                  }
                  onPress={
                    openFollowing
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    {formatCount(
                      followingCount
                    )}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={
                styles.bioSection
              }
            >
              <View
                style={
                  styles.nameRow
                }
              >
                <Text
                  style={
                    styles.displayName
                  }
                >
                  {displayName}
                </Text>

                {isVerified && (
                  <VerifiedBadge
                    size={17}
                  />
                )}
              </View>

              {user?.bio ? (
                <Text
                  style={
                    styles.bioText
                  }
                >
                  {user.bio}
                </Text>
              ) : null}

              {websiteValue ? (
                <TouchableOpacity
                  onPress={
                    openWebsite
                  }
                  style={
                    styles.websiteRow
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="link-outline"
                    size={18}
                    color={
                      COLORS.black
                    }
                  />

                  <Text
                    style={
                      styles.websiteText
                    }
                    numberOfLines={2}
                  >
                    {String(
                      websiteValue
                    ).replace(
                      /^https?:\/\//,
                      ""
                    )}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {musicTitle ? (
                <View
                  style={
                    styles.musicRow
                  }
                >
                  <Ionicons
                    name="musical-notes-outline"
                    size={18}
                    color={
                      COLORS.black
                    }
                  />

                  <Text
                    style={
                      styles.musicText
                    }
                    numberOfLines={1}
                  >
                    {musicTitle}
                    {musicArtist
                      ? ` · ${musicArtist}`
                      : ""}
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={
                styles.actionRow
              }
            >
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  styles.profileButtonLarge,
                ]}
                onPress={() =>
                  setEditVisible(
                    true
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.profileButtonText
                  }
                >
                  Edit profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.profileButton,
                  styles.profileButtonLarge,
                ]}
                onPress={
                  openShareProfile
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.profileButtonText
                  }
                >
                  Share profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.addPersonButton
                }
                onPress={
                  openFollowers
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.highlightsSection
              }
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.highlightsContent
                }
              >

                <TouchableOpacity
                  style={
                    styles.highlightItem
                  }
                  onPress={
                    openCreateHighlight
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.highlightCircle,
                      styles.newHighlightCircle,
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={31}
                      color={
                        COLORS.black
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.highlightLabel
                    }
                  >
                    New
                  </Text>
                </TouchableOpacity>

                {highlights.map(
                  (
                    highlight,
                    index
                  ) => {
                    const id =
                      getId(
                        highlight
                      ) ||
                      `highlight-${index}`;

                    const cover =
                      getHighlightCover(
                        highlight
                      );

                    const title =
                      highlight?.title ||
                      highlight?.name ||
                      "Highlight";

                    return (
                      <TouchableOpacity
                        key={id}
                        style={
                          styles.highlightItem
                        }
                        onPress={() =>
                          openHighlight(
                            highlight
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <View
                          style={
                            styles.highlightCircle
                          }
                        >
                          {cover ? (
                            <Image
                              source={{
                                uri: cover,
                              }}
                              style={
                                styles.highlightImage
                              }
                            />
                          ) : (
                            <View
                              style={
                                styles.highlightPlaceholder
                              }
                            >
                              <Ionicons
                                name="images-outline"
                                size={27}
                                color={
                                  COLORS.gray
                                }
                              />
                            </View>
                          )}
                        </View>

                        <Text
                          style={
                            styles.highlightLabel
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {title}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </ScrollView>
            </View>
          </View>

          <View
            style={
              styles.tabsContainer
            }
          >
            {TABS.map(
              (tab) => {
                const selected =
                  activeTab ===
                  tab.key;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={
                      styles.tabButton
                    }
                    onPress={() =>
                      setActiveTab(
                        tab.key
                      )
                    }
                    activeOpacity={
                      0.7
                    }
                  >
                    <Ionicons
                      name={
                        tab.icon
                      }
                      size={25}
                      color={
                        selected
                          ? COLORS.black
                          : COLORS.muted
                      }
                    />

                    {selected && (
                      <View
                        style={
                          styles.activeTabLine
                        }
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          <ProfileGrid
            posts={
              visiblePosts
            }
            loading={
              currentTabLoading
            }
            emptyTitle={
              activeTab ===
              "posts"
                ? "No posts yet"
                : activeTab ===
                  "reels"
                ? "No reels yet"
                : activeTab ===
                  "reposts"
                ? "No reposts yet"
                : "No tagged posts yet"
            }
          />

          <View
            style={
              styles.bottomSpacing
            }
          />
        </ScrollView>

        <Modal
          visible={
            menuVisible
          }
          transparent
          animationType="slide"
          onRequestClose={() =>
            setMenuVisible(
              false
            )
          }
        >
          <Pressable
            style={
              styles.modalBackdrop
            }
            onPress={() =>
              setMenuVisible(
                false
              )
            }
          >
            <Pressable
              style={
                styles.menuSheet
              }
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              <View
                style={
                  styles.sheetHandle
                }
              />

              <Text
                style={
                  styles.menuTitle
                }
              >
                Menu
              </Text>

              <MenuItem
                icon="settings-outline"
                label="Settings and activity"
                onPress={
                  openSettings
                }
              />

              <MenuItem
                icon="time-outline"
                label="Your activity"
                onPress={
                  openActivity
                }
              />

              <MenuItem
                icon="archive-outline"
                label="Archive"
                onPress={
                  openArchive
                }
              />

              <MenuItem
                icon="bookmark-outline"
                label="Saved"
                onPress={
                  openSaved
                }
              />

              <MenuItem
                icon="people-outline"
                label="Close friends"
                onPress={
                  openCloseFriends
                }
              />

              <View
                style={
                  styles.menuDivider
                }
              />

              <MenuItem
                icon="close-outline"
                label="Cancel"
                onPress={() =>
                  setMenuVisible(
                    false
                  )
                }
              />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={
            editVisible
          }
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() =>
            setEditVisible(
              false
            )
          }
        >
          <SafeAreaView
            style={
              styles.editScreen
            }
            edges={["top"]}
          >
            <View
              style={
                styles.editHeader
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setEditVisible(
                    false
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-outline"
                  size={31}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.editHeaderTitle
                }
              >
                Edit profile
              </Text>

              <TouchableOpacity
                onPress={
                  saveProfile
                }
                disabled={
                  savingProfile
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.saveText,
                    savingProfile &&
                      styles.disabledText,
                  ]}
                >
                  {savingProfile
                    ? "Saving..."
                    : "Done"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.editContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >

              <TouchableOpacity
                style={
                  styles.editAvatarContainer
                }
                onPress={
                  pickAvatar
                }
                activeOpacity={0.8}
              >
                {selectedAvatar ? (
                  <Image
                    source={{
                      uri: selectedAvatar,
                    }}
                    style={
                      styles.editAvatar
                    }
                  />
                ) : (
                  <View
                    style={[
                      styles.editAvatar,
                      styles.avatarPlaceholder,
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={52}
                      color={
                        COLORS.gray
                      }
                    />
                  </View>
                )}

                <Text
                  style={
                    styles.changePhotoText
                  }
                >
                  Change profile photo
                </Text>
              </TouchableOpacity>

              <EditField
                label="Username"
                value={
                  username
                }
                onChangeText={
                  setUsername
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
              />

              <EditField
                label="Name"
                value={name}
                onChangeText={
                  setName
                }
              />

              <EditField
                label="Bio"
                value={bio}
                onChangeText={
                  setBio
                }
                multiline
                maxLength={150}
                inputStyle={
                  styles.bioInput
                }
              />

              <EditField
                label="Website"
                value={
                  website
                }
                onChangeText={
                  setWebsite
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                keyboardType="url"
              />

              <EditField
                label="Pronouns"
                value={
                  pronouns
                }
                onChangeText={
                  setPronouns
                }
              />

              <EditField
                label="Gender"
                value={
                  gender
                }
                onChangeText={
                  setGender
                }
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={
            highlightVisible
          }
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() =>
            setHighlightVisible(
              false
            )
          }
        >
          <SafeAreaView
            style={
              styles.highlightModal
            }
            edges={["top"]}
          >
            <View
              style={
                styles.highlightModalHeader
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setHighlightVisible(
                    false
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-outline"
                  size={31}
                  color={
                    COLORS.black
                  }
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.highlightModalTitle
                }
              >
                New Highlight
              </Text>

              <TouchableOpacity
                onPress={
                  saveHighlight
                }
                disabled={
                  creatingHighlight
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.saveText,
                    creatingHighlight &&
                      styles.disabledText,
                  ]}
                >
                  {creatingHighlight
                    ? "Saving..."
                    : "Done"}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.highlightNameContainer
              }
            >
              <TextInput
                value={
                  highlightName
                }
                onChangeText={
                  setHighlightName
                }
                placeholder="Highlight name"
                placeholderTextColor={
                  COLORS.muted
                }
                style={
                  styles.highlightNameInput
                }
                maxLength={32}
              />
            </View>

            <View
              style={
                styles.selectedCountContainer
              }
            >
              <Text
                style={
                  styles.selectedCountText
                }
              >
                {
                  selectedStories.length
                }{" "}
                selected
              </Text>
            </View>

            {storiesLoading ? (
              <View
                style={
                  styles.highlightLoading
                }
              >
                <Text
                  style={
                    styles.highlightLoadingText
                  }
                >
                  Loading Stories...
                </Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={
                  styles.storyPickerGrid
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {myStories.length ===
                0 ? (
                  <View
                    style={
                      styles.noStoriesContainer
                    }
                  >
                    <Ionicons
                      name="images-outline"
                      size={42}
                      color={
                        COLORS.gray
                      }
                    />

                    <Text
                      style={
                        styles.noStoriesTitle
                      }
                    >
                      No Stories
                    </Text>

                    <Text
                      style={
                        styles.noStoriesText
                      }
                    >
                      Your active Stories will
                      appear here.
                    </Text>
                  </View>
                ) : (
                  myStories.map(
                    (
                      story,
                      index
                    ) => {
                      const storyId =
                        getId(
                          story
                        ) ||
                        `story-${index}`;

                      const image =
                        getStoryImage(
                          story
                        );

                      const selected =
                        selectedStories.includes(
                          storyId
                        );

                      return (
                        <TouchableOpacity
                          key={
                            storyId
                          }
                          style={
                            styles.storyPickerItem
                          }
                          onPress={() =>
                            toggleStorySelection(
                              storyId
                            )
                          }
                          activeOpacity={
                            0.8
                          }
                        >
                          {image ? (
                            <Image
                              source={{
                                uri: image,
                              }}
                              style={
                                styles.storyPickerImage
                              }
                            />
                          ) : (
                            <View
                              style={
                                styles.storyPickerPlaceholder
                              }
                            >
                              <Ionicons
                                name="image-outline"
                                size={28}
                                color={
                                  COLORS.gray
                                }
                              />
                            </View>
                          )}

                          {selected && (
                            <View
                              style={
                                styles.storySelectedOverlay
                              }
                            >
                              <View
                                style={
                                  styles.storyCheck
                                }
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={
                                    COLORS.white
                                  }
                                />
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }
                  )
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function Stat({
  value,
  label,
}) {
  return (
    <View
      style={styles.stat}
    >
      <Text
        style={
          styles.statNumber
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={25}
        color={COLORS.black}
      />

      <Text
        style={
          styles.menuItemText
        }
      >
        {label}
      </Text>

      {label !==
        "Cancel" && (
        <Ionicons
          name="chevron-forward"
          size={19}
          color={COLORS.gray}
          style={
            styles.menuChevron
          }
        />
      )}
    </TouchableOpacity>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  multiline = false,
  maxLength,
  autoCapitalize = "sentences",
  autoCorrect = true,
  keyboardType = "default",
  inputStyle,
}) {
  return (
    <View
      style={styles.editField}
    >
      <Text
        style={
          styles.editLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        multiline={
          multiline
        }
        maxLength={
          maxLength
        }
        autoCapitalize={
          autoCapitalize
        }
        autoCorrect={
          autoCorrect
        }
        keyboardType={
          keyboardType
        }
        style={[
          styles.editInput,
          inputStyle,
        ]}
        placeholderTextColor={
          COLORS.muted
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    screen: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    loadingScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.white,
    },

    loadingText: {
      fontSize: 15,
      color:
        COLORS.gray,
    },

    header: {
      height: 58,
      paddingHorizontal: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    headerIcon: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    usernameHeader: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 6,
    },

    lockIcon: {
      marginRight: 7,
    },

    headerUsername: {
      maxWidth: 180,
      fontSize: 20,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    headerRight: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    profileSection: {
      paddingHorizontal: 12,
    },

    topProfileRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingTop: 8,
    },

    avatarWrapper: {
      width: 96,
      height: 96,
      position:
        "relative",
      marginRight: 18,
    },

    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor:
        COLORS.lightGray,
    },

    avatarPlaceholder: {
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    addStoryButton: {
      position:
        "absolute",
      right: -1,
      bottom: -1,
      width: 29,
      height: 29,
      borderRadius: 15,
      backgroundColor:
        COLORS.blue,
      borderWidth: 3,
      borderColor:
        COLORS.white,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    statsRow: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-around",
    },

    stat: {
      minWidth: 72,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    statNumber: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    statLabel: {
      marginTop: 2,
      fontSize: 14,
      color:
        COLORS.black,
    },

    bioSection: {
      marginTop: 18,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    displayName: {
      marginRight: 5,
      fontSize: 15,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    bioText: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 19,
      color:
        COLORS.black,
    },

    websiteRow: {
      marginTop: 5,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    websiteText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 14,
      lineHeight: 19,
      fontWeight:
        "600",
      color:
        COLORS.black,
    },

    musicRow: {
      marginTop: 7,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    musicText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 14,
      color:
        COLORS.black,
    },

    actionRow: {
      marginTop: 15,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    profileButton: {
      height: 38,
      borderRadius: 9,
      backgroundColor:
        COLORS.lightGray,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    profileButtonLarge: {
      flex: 1,
      marginRight: 7,
    },

    profileButtonText: {
      fontSize: 14,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    addPersonButton: {
      width: 43,
      height: 38,
      borderRadius: 9,
      backgroundColor:
        COLORS.lightGray,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    highlightsSection: {
      marginTop: 21,
      marginHorizontal: -12,
    },

    highlightsContent: {
      paddingHorizontal: 4,
      paddingBottom: 13,
    },

    highlightItem: {
      width: 82,
      alignItems:
        "center",
      marginHorizontal: 7,
    },

    highlightCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      padding: 4,
      backgroundColor:
        COLORS.white,
      borderWidth: 3,
      borderColor:
        "#D9DDE1",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    newHighlightCircle: {
      borderColor:
        "#E1E5E9",
    },

    highlightImage: {
      width: "100%",
      height: "100%",
      borderRadius: 34,
    },

    highlightPlaceholder: {
      width: "100%",
      height: "100%",
      borderRadius: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.lightGray,
    },

    highlightLabel: {
      width: 78,
      marginTop: 6,
      textAlign:
        "center",
      fontSize: 12,
      color:
        COLORS.black,
    },

    tabsContainer: {
      height: 51,
      marginTop: 3,
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor:
        COLORS.border,
      flexDirection:
        "row",
    },

    tabButton: {
      flex: 1,
      height: 51,
      alignItems:
        "center",
      justifyContent:
        "center",
      position:
        "relative",
    },

    activeTabLine: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 1.5,
      backgroundColor:
        COLORS.black,
    },

    bottomSpacing: {
      height: 30,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      justifyContent:
        "flex-end",
    },

    menuSheet: {
      backgroundColor:
        COLORS.white,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingTop: 9,
      paddingBottom: 30,
    },

    sheetHandle: {
      alignSelf:
        "center",
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor:
        "#C7C7C7",
      marginBottom: 12,
    },

    menuTitle: {
      paddingHorizontal: 22,
      paddingBottom: 12,
      fontSize: 18,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    menuItem: {
      minHeight: 56,
      paddingHorizontal: 22,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    menuItemText: {
      marginLeft: 16,
      fontSize: 15,
      fontWeight:
        "500",
      color:
        COLORS.black,
    },

    menuChevron: {
      marginLeft:
        "auto",
    },

    menuDivider: {
      height:
        StyleSheet.hairlineWidth,
      backgroundColor:
        COLORS.border,
      marginVertical: 7,
    },

    editScreen: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    editHeader: {
      height: 55,
      paddingHorizontal: 16,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    editHeaderTitle: {
      fontSize: 17,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    saveText: {
      fontSize: 15,
      fontWeight:
        "700",
      color:
        COLORS.blue,
    },

    disabledText: {
      opacity: 0.4,
    },

    editContent: {
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 50,
    },

    editAvatarContainer: {
      alignItems:
        "center",
      marginBottom: 26,
    },

    editAvatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor:
        COLORS.lightGray,
    },

    changePhotoText: {
      marginTop: 11,
      fontSize: 14,
      fontWeight:
        "600",
      color:
        COLORS.blue,
    },

    editField: {
      marginBottom: 20,
    },

    editLabel: {
      marginBottom: 7,
      fontSize: 13,
      color:
        COLORS.gray,
    },

    editInput: {
      minHeight: 44,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 9,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 15,
      color:
        COLORS.black,
      backgroundColor:
        COLORS.white,
    },

    bioInput: {
      minHeight: 90,
      textAlignVertical:
        "top",
    },

    highlightModal: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    highlightModalHeader: {
      height: 55,
      paddingHorizontal: 16,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        COLORS.border,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    highlightModalTitle: {
      fontSize: 17,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    highlightNameContainer: {
      paddingHorizontal: 16,
      paddingTop: 14,
    },

    highlightNameInput: {
      height: 44,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 9,
      paddingHorizontal: 13,
      fontSize: 15,
      color:
        COLORS.black,
    },

    selectedCountContainer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },

    selectedCountText: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        COLORS.black,
    },

    highlightLoading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    highlightLoadingText: {
      fontSize: 15,
      color:
        COLORS.gray,
    },

    storyPickerGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
    },

    storyPickerItem: {
      width: "33.3333%",
      aspectRatio: 0.72,
      padding: 1,
      position:
        "relative",
    },

    storyPickerImage: {
      width: "100%",
      height: "100%",
    },

    storyPickerPlaceholder: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        COLORS.lightGray,
    },

    storySelectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.25)",
      alignItems:
        "flex-end",
      justifyContent:
        "flex-start",
      padding: 8,
    },

    storyCheck: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor:
        COLORS.blue,
      borderWidth: 2,
      borderColor:
        COLORS.white,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    noStoriesContainer: {
      width: "100%",
      minHeight: 260,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    noStoriesTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight:
        "700",
      color:
        COLORS.black,
    },

    noStoriesText: {
      marginTop: 6,
      textAlign:
        "center",
      fontSize: 14,
      lineHeight: 20,
      color:
        COLORS.gray,
    },
  });