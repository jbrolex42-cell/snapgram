import React, {
  useCallback,
  useEffect,
  useMemo,
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
  getStories,
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
  lightGray: "#EFEFEF",
  border: "#DBDBDB",
  background: "#FFFFFF",
  muted: "#8E8E8E",
  danger: "#ED4956",
  blue: "#0095F6",
};

const TABS = [
  {
    key: "posts",
    label: "Posts",
    icon: "grid-outline",
  },
  {
    key: "reels",
    label: "Reels",
    icon: "play-outline",
  },
  {
    key: "reposts",
    label: "Reposts",
    icon: "repeat-outline",
  },
  {
    key: "tagged",
    label: "Tagged",
    icon: "person-outline",
  },
];

function getId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return (
    value._id ||
    value.id ||
    value.userId ||
    null
  );
}

function getImageUri(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return (
    value.url ||
    value.uri ||
    value.secure_url ||
    value.src ||
    value.image ||
    value.imageUrl ||
    null
  );
}

function getProfileAvatar(user) {
  return (
    getImageUri(user?.avatar) ||
    getImageUri(user?.profilePicture) ||
    getImageUri(user?.profileImage) ||
    null
  );
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    "User"
  );
}

function getUsername(user) {
  return (
    user?.username ||
    user?.handle ||
    "username"
  );
}

function formatCount(value) {
  const number = Number(value || 0);

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
  if (!value) return null;

  const trimmed = String(value).trim();

  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeStories(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response?.stories ||
    response?.data?.stories ||
    response?.data ||
    []
  );
}

function normalizeHighlights(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response?.highlights ||
    response?.data?.highlights ||
    response?.data ||
    []
  );
}

function normalizeCreatedHighlight(response) {
  return (
    response?.highlight ||
    response?.data?.highlight ||
    response?.data ||
    response
  );
}

export default function ProfileScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("posts");

  const [menuVisible, setMenuVisible] = useState(false);

  const [editVisible, setEditVisible] = useState(false);

  const [highlightVisible, setHighlightVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [highlights, setHighlights] = useState([]);

  const [myStories, setMyStories] = useState([]);

  const [storiesLoading, setStoriesLoading] = useState(false);

  const [highlightsLoading, setHighlightsLoading] =
    useState(false);

  const [selectedStories, setSelectedStories] =
    useState([]);

  const [creatingHighlight, setCreatingHighlight] =
    useState(false);

  const [highlightName, setHighlightName] =
    useState("");

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
    if (!user) return;

    setUsername(user.username || "");
    setName(
      user.name ||
      user.fullName ||
      ""
    );

    setBio(user.bio || "");

    setWebsite(
      user.website ||
      user.link ||
      ""
    );

    setPronouns(user.pronouns || "");
    setGender(user.gender || "");

    setSelectedAvatar(
      getProfileAvatar(user)
    );
  }, [user]);

  const profilePosts = useMemo(() => {
    if (!user) return [];

    return (
      user.posts ||
      user.profilePosts ||
      user.recentPosts ||
      []
    );
  }, [user]);


  const reels = useMemo(() => {
    return profilePosts.filter((post) => {
      return (
        post?.isReel === true ||
        post?.type === "reel" ||
        post?.mediaType === "reel"
      );
    });
  }, [profilePosts]);


  const reposts = useMemo(() => {
    if (!user) return [];

    return (
      user.reposts ||
      user.repostedPosts ||
      user.repostPosts ||
      []
    );
  }, [user]);


  const taggedPosts = useMemo(() => {
    if (!user) return [];

    return (
      user.taggedPosts ||
      user.tagged ||
      user.postsTaggedIn ||
      []
    );
  }, [user]);


  const visiblePosts = useMemo(() => {
    switch (activeTab) {
      case "reels":
        return reels;

      case "reposts":
        return reposts;

      case "tagged":
        return taggedPosts;

      case "posts":
      default:
        return profilePosts.filter((post) => {
          return !(
            post?.isReel === true ||
            post?.type === "reel" ||
            post?.mediaType === "reel"
          );
        });
    }
  }, [
    activeTab,
    profilePosts,
    reels,
    reposts,
    taggedPosts,
  ]);

  const postsCount =
    user?.postsCount ??
    user?.postCount ??
    profilePosts.length ??
    0;

  const followersCount =
    user?.followersCount ??
    user?.followers?.length ??
    0;

  const followingCount =
    user?.followingCount ??
    user?.following?.length ??
    0;

  const loadHighlights = useCallback(async () => {
    if (!user) return;

    try {
      setHighlightsLoading(true);

      const response = await getHighlights();

      const data = normalizeHighlights(response);

      const currentUserId = getId(user);

      const filtered = data.filter((highlight) => {
        if (!highlight?.user) {
          return true;
        }

        const highlightUserId =
          getId(highlight.user);

        return (
          !currentUserId ||
          !highlightUserId ||
          highlightUserId === currentUserId
        );
      });

      setHighlights(filtered);
    } catch (error) {
      console.log(
        "LOAD HIGHLIGHTS ERROR:",
        error
      );
    } finally {
      setHighlightsLoading(false);
    }
  }, [user]);


  useFocusEffect(
    useCallback(() => {
      loadHighlights();
    }, [loadHighlights])
  );

  const loadMyStories = useCallback(async () => {
    if (!user) return [];

    try {
      setStoriesLoading(true);

      const response = await getStories();

      const stories = normalizeStories(response);

      const currentUserId = getId(user);

      const mine = stories.filter((story) => {
        const storyUserId =
          getId(story?.user) ||
          story?.userId ||
          getId(story?.author);

        if (!storyUserId) {
          return true;
        }

        return (
          !currentUserId ||
          storyUserId === currentUserId
        );
      });

      setMyStories(mine);

      return mine;
    } catch (error) {
      console.log(
        "LOAD STORIES ERROR:",
        error
      );

      setMyStories([]);

      return [];
    } finally {
      setStoriesLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadHighlights();
    } finally {
      setRefreshing(false);
    }
  }, [loadHighlights]);

  const openSettings = () => {
    setMenuVisible(false);

    router.push("/settings");
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

    router.push("/saved");
  };


  const openCloseFriends = () => {
    setMenuVisible(false);

    router.push(
      "/settings/privacy/close-friends"
    );
  };


  const openFollowers = () => {
    const userId = getId(user);

    if (!userId) return;

    router.push(
      `/profile/followers?userId=${encodeURIComponent(
        userId
      )}`
    );
  };


  const openFollowing = () => {
    const userId = getId(user);

    if (!userId) return;

    router.push(
      `/profile/following?userId=${encodeURIComponent(
        userId
      )}`
    );
  };


  const openCreatePost = () => {
    router.push("/(tabs)/create");
  };


  const openShareProfile = async () => {
    try {
      const usernameValue =
        getUsername(user);

      const profileUrl =
        `https://snapgram.app/${usernameValue}`;

      await Share.share({
        message:
          `Check out @${usernameValue} on Snapgram\n${profileUrl}`,
      });
    } catch (error) {
      console.log(
        "SHARE PROFILE ERROR:",
        error
      );
    }
  };


  const openWebsite = async () => {
    const url = normalizeWebsite(website);

    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Unable to open link",
        "This website could not be opened."
      );
    }
  };

  const openThreads = () => {
    Alert.alert(
      "Threads",
      "Connect your Threads profile here when the Threads integration is available."
    );
  };

  const pickAvatar = async () => {
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
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

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
      console.log(
        "AVATAR PICKER ERROR:",
        error
      );
    }
  };

  const saveProfile = async () => {
    const cleanUsername =
      username.trim().toLowerCase();

    const cleanName =
      name.trim();

    const cleanBio =
      bio.trim();

    if (cleanUsername.length < 3) {
      Alert.alert(
        "Invalid username",
        "Username must contain at least 3 characters."
      );

      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        username: cleanUsername,
        name: cleanName,
        bio: cleanBio,
        website: website.trim(),
        pronouns: pronouns.trim(),
        gender: gender.trim(),
        avatar: selectedAvatar,
      };

      const response =
        await updateProfile(payload);

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
        updatedUser?.name ||
        updatedUser?.fullName ||
        cleanName
      );

      setBio(
        updatedUser?.bio ??
        cleanBio
      );

      setWebsite(
        updatedUser?.website ??
        website.trim()
      );

      setPronouns(
        updatedUser?.pronouns ??
        pronouns.trim()
      );

      setGender(
        updatedUser?.gender ??
        gender.trim()
      );

      setEditVisible(false);
    } catch (error) {
      console.log(
        "SAVE PROFILE ERROR:",
        error
      );

      Alert.alert(
        "Couldn't save profile",
        error?.message ||
          "Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreateHighlight = async () => {
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


  const toggleStorySelection = (storyId) => {
    if (!storyId) return;

    setSelectedStories((current) => {
      if (current.includes(storyId)) {
        return current.filter(
          (id) => id !== storyId
        );
      }

      return [
        ...current,
        storyId,
      ];
    });
  };


  const saveHighlight = async () => {
    if (!selectedStories.length) {
      Alert.alert(
        "Select a Story",
        "Choose at least one Story."
      );

      return;
    }

    try {
      setCreatingHighlight(true);

      const response =
        await createHighlight({
          name:
            highlightName.trim() ||
            "Highlights",

          storyIds:
            selectedStories,
        });

      const created =
        normalizeCreatedHighlight(
          response
        );

      if (created) {
        setHighlights((current) => [
          created,
          ...current,
        ]);
      } else {
        await loadHighlights();
      }

      setHighlightVisible(false);
      setSelectedStories([]);
      setHighlightName("");
    } catch (error) {
      console.log(
        "CREATE HIGHLIGHT ERROR:",
        error
      );

      Alert.alert(
        "Couldn't create Highlight",
        error?.message ||
          "Please try again."
      );
    } finally {
      setCreatingHighlight(false);
    }
  };


  const openHighlight = (highlight) => {
    const highlightId =
      getId(highlight);

    if (!highlightId) return;

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
        <Text style={styles.loadingText}>
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
        <Text style={styles.loadingText}>
          Profile unavailable
        </Text>
      </SafeAreaView>
    );
  }

  const avatarUri =
    getProfileAvatar(user);

  const displayName =
    getDisplayName(user);

  const displayUsername =
    getUsername(user);

  const websiteValue =
    user?.website ||
    user?.link ||
    website;

  const musicTitle =
    user?.profileMusic?.title ||
    user?.music?.title ||
    null;

  const musicArtist =
    user?.profileMusic?.artist ||
    user?.music?.artist ||
    null;

  const isPrivate =
    Boolean(user?.isPrivate);


  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.black}
            />
          }
        >

          <View style={styles.header}>

            <TouchableOpacity
              style={styles.headerIcon}
              onPress={openCreatePost}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-outline"
                size={32}
                color={COLORS.black}
              />
            </TouchableOpacity>


            <View
              style={styles.usernameHeader}
            >
              {isPrivate && (
                <Ionicons
                  name="lock-closed"
                  size={17}
                  color={COLORS.black}
                  style={styles.lockIcon}
                />
              )}

              <Text
                style={styles.headerUsername}
                numberOfLines={1}
              >
                {displayUsername}
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color={COLORS.black}
              />
            </View>


            <View style={styles.headerRight}>

              <TouchableOpacity
                style={styles.headerIcon}
                onPress={openThreads}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="at-outline"
                  size={30}
                  color={COLORS.black}
                />
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.headerIcon}
                onPress={() =>
                  setMenuVisible(true)
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="menu-outline"
                  size={32}
                  color={COLORS.black}
                />
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.profileSection}>

            <View style={styles.topProfileRow}>

              {/* Avatar */}

              <View style={styles.avatarWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setEditVisible(true)
                  }
                >
                  {avatarUri ? (
                    <Image
                      source={{
                        uri: avatarUri,
                      }}
                      style={styles.avatar}
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
                        color={COLORS.gray}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addStoryButton}
                  onPress={openCreatePost}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

              </View>

              <View style={styles.statsRow}>

                <Stat
                  value={formatCount(postsCount)}
                  label="posts"
                />

                <TouchableOpacity
                  style={styles.stat}
                  onPress={openFollowers}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>
                    {formatCount(
                      followersCount
                    )}
                  </Text>

                  <Text style={styles.statLabel}>
                    followers
                  </Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.stat}
                  onPress={openFollowing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNumber}>
                    {formatCount(
                      followingCount
                    )}
                  </Text>

                  <Text style={styles.statLabel}>
                    following
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

            <View style={styles.bioSection}>

              <View style={styles.nameRow}>
                <Text style={styles.displayName}>
                  {displayName}
                </Text>

                {user?.isVerified && (
                  <VerifiedBadge
                    size={17}
                  />
                )}
              </View>


              {user?.bio ? (
                <Text style={styles.bioText}>
                  {user.bio}
                </Text>
              ) : null}


              {websiteValue ? (
                <TouchableOpacity
                  onPress={openWebsite}
                  activeOpacity={0.7}
                  style={styles.websiteRow}
                >
                  <Ionicons
                    name="link-outline"
                    size={22}
                    color={COLORS.black}
                  />

                  <Text
                    style={styles.websiteText}
                    numberOfLines={2}
                  >
                    {websiteValue.replace(
                      /^https?:\/\//,
                      ""
                    )}
                  </Text>
                </TouchableOpacity>
              ) : null}


              {musicTitle ? (
                <View style={styles.musicRow}>

                  <Ionicons
                    name="play-circle-outline"
                    size={22}
                    color={COLORS.black}
                  />

                  <Text
                    style={styles.musicText}
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

            <View style={styles.actionRow}>

              <TouchableOpacity
                style={[
                  styles.profileButton,
                  styles.profileButtonLarge,
                ]}
                onPress={() =>
                  setEditVisible(true)
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
                onPress={openShareProfile}
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
                onPress={() =>
                  router.push(
                    "/profile/followers"
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={21}
                  color={COLORS.black}
                />
              </TouchableOpacity>

            </View>

            <View
              style={styles.highlightsSection}
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
                  style={styles.highlightItem}
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
                      size={34}
                      color={COLORS.black}
                    />
                  </View>

                  <Text
                    style={
                      styles.highlightLabel
                    }
                    numberOfLines={1}
                  >
                    New
                  </Text>
                </TouchableOpacity>

                {highlights.map(
                  (highlight, index) => {
                    const highlightId =
                      getId(
                        highlight
                      ) ||
                      `highlight-${index}`;

                    const cover =
                      getImageUri(
                        highlight?.cover
                      ) ||
                      getImageUri(
                        highlight?.coverImage
                      ) ||
                      getImageUri(
                        highlight?.image
                      );

                    const label =
                      highlight?.name ||
                      highlight?.title ||
                      "Highlight";

                    return (
                      <TouchableOpacity
                        key={highlightId}
                        style={
                          styles.highlightItem
                        }
                        onPress={() =>
                          openHighlight(
                            highlight
                          )
                        }
                        activeOpacity={0.8}
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
                          numberOfLines={1}
                        >
                          {label}
                        </Text>

                      </TouchableOpacity>
                    );
                  }
                )}

              </ScrollView>

            </View>

          </View>

          <View style={styles.tabsContainer}>

            {TABS.map((tab) => {
              const selected =
                activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabButton}
                  onPress={() =>
                    setActiveTab(tab.key)
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon}
                    size={26}
                    color={
                      selected
                        ? COLORS.black
                        : COLORS.muted
                    }
                  />

                  {selected && (
                    <View
                      style={styles.activeTabLine}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

          </View>

          {visiblePosts.length > 0 ? (
            <ProfileGrid
              posts={visiblePosts}
            />
          ) : (
            <ProfileEmptyState
              tab={activeTab}
              onCreatePost={
                activeTab === "posts"
                  ? openCreatePost
                  : undefined
              }
            />
          )}

        </ScrollView>

        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setMenuVisible(false)
          }
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() =>
              setMenuVisible(false)
            }
          >
            <Pressable
              style={styles.menuSheet}
              onPress={(event) =>
                event.stopPropagation()
              }
            >

              <View
                style={styles.sheetHandle}
              />


              <Text style={styles.menuTitle}>
                Menu
              </Text>


              <MenuItem
                icon="settings-outline"
                label="Settings and activity"
                onPress={openSettings}
              />


              <MenuItem
                icon="time-outline"
                label="Your activity"
                onPress={openActivity}
              />


              <MenuItem
                icon="archive-outline"
                label="Archive"
                onPress={openArchive}
              />


              <MenuItem
                icon="bookmark-outline"
                label="Saved"
                onPress={openSaved}
              />


              <MenuItem
                icon="people-outline"
                label="Close friends"
                onPress={openCloseFriends}
              />


              <View
                style={styles.menuDivider}
              />


              <MenuItem
                icon="close-outline"
                label="Cancel"
                onPress={() =>
                  setMenuVisible(false)
                }
              />

            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={editVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() =>
            setEditVisible(false)
          }
        >
          <SafeAreaView
            style={styles.editScreen}
            edges={["top"]}
          >

            <View style={styles.editHeader}>

              <TouchableOpacity
                onPress={() =>
                  setEditVisible(false)
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-outline"
                  size={31}
                  color={COLORS.black}
                />
              </TouchableOpacity>


              <Text
                style={styles.editHeaderTitle}
              >
                Edit profile
              </Text>


              <TouchableOpacity
                onPress={saveProfile}
                disabled={savingProfile}
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
                onPress={pickAvatar}
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
                      color={COLORS.gray}
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
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />


              <EditField
                label="Name"
                value={name}
                onChangeText={setName}
              />


              <EditField
                label="Bio"
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={150}
                inputStyle={
                  styles.bioInput
                }
              />


              <EditField
                label="Website"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <EditField
                label="Pronouns"
                value={pronouns}
                onChangeText={setPronouns}
              />

              <EditField
                label="Gender"
                value={gender}
                onChangeText={setGender}
              />

            </ScrollView>

          </SafeAreaView>
        </Modal>

        <Modal
          visible={highlightVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() =>
            setHighlightVisible(false)
          }
        >
          <SafeAreaView
            style={styles.highlightModal}
            edges={["top"]}
          >

            <View
              style={
                styles.highlightModalHeader
              }
            >

              <TouchableOpacity
                onPress={() =>
                  setHighlightVisible(false)
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-outline"
                  size={31}
                  color={COLORS.black}
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
                onPress={saveHighlight}
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
                value={highlightName}
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
                {selectedStories.length}{" "}
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

                {myStories.map(
                  (story, index) => {
                    const storyId =
                      getId(story) ||
                      `story-${index}`;

                    const image =
                      getImageUri(
                        story?.media
                      ) ||
                      getImageUri(
                        story?.image
                      ) ||
                      getImageUri(
                        story?.mediaUrl
                      ) ||
                      getImageUri(
                        story?.url
                      );

                    const selected =
                      selectedStories.includes(
                        storyId
                      );

                    return (
                      <TouchableOpacity
                        key={storyId}
                        style={
                          styles.storyPickerItem
                        }
                        onPress={() =>
                          toggleStorySelection(
                            storyId
                          )
                        }
                        activeOpacity={0.8}
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
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
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

      <Text style={styles.menuItemText}>
        {label}
      </Text>

      {label !== "Cancel" && (
        <Ionicons
          name="chevron-forward"
          size={19}
          color={COLORS.gray}
          style={styles.menuChevron}
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
    <View style={styles.editField}>

      <Text style={styles.editLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
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

function ProfileEmptyState({
  tab,
  onCreatePost,
}) {
  const config = {
    posts: {
      icon: "camera-outline",
      title: "No posts yet",
      subtitle:
        "Share photos and videos on your profile.",
    },

    reels: {
      icon: "play-circle-outline",
      title: "No Reels yet",
      subtitle:
        "When you share Reels, they'll appear here.",
    },

    reposts: {
      icon: "repeat-outline",
      title: "No reposts yet",
      subtitle:
        "Posts and Reels you repost will appear here.",
    },

    tagged: {
      icon: "person-outline",
      title: "No posts yet",
      subtitle:
        "When people tag you, they'll appear here.",
    },
  };

  const current =
    config[tab] || config.posts;

  return (
    <View style={styles.emptyState}>

      <View
        style={styles.emptyIconCircle}
      >
        <Ionicons
          name={current.icon}
          size={38}
          color={COLORS.black}
        />
      </View>


      <Text style={styles.emptyTitle}>
        {current.title}
      </Text>


      <Text style={styles.emptySubtitle}>
        {current.subtitle}
      </Text>


      {onCreatePost && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onCreatePost}
          activeOpacity={0.8}
        >
          <Text
            style={styles.emptyButtonText}
          >
            Create your first post
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },

  header: {
    height: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  usernameHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  lockIcon: {
    marginRight: 7,
  },

  headerUsername: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    maxWidth: 180,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileSection: {
    paddingHorizontal: 12,
  },

  topProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },

  avatarWrapper: {
    width: 96,
    height: 96,
    position: "relative",
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
    alignItems: "center",
    justifyContent: "center",
  },

  addStoryButton: {
    position: "absolute",
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
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  stat: {
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: COLORS.black,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.black,
  },

  bioSection: {
    marginTop: 18,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
    marginRight: 5,
  },

  bioText: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.black,
  },

  websiteRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  websiteText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: COLORS.black,
  },

  musicRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  musicText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.black,
  },

  actionRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  profileButton: {
    height: 38,
    borderRadius: 9,
    backgroundColor:
      COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },

  profileButtonLarge: {
    flex: 1,
  },

  profileButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
  },

  addPersonButton: {
    width: 43,
    height: 38,
    borderRadius: 9,
    backgroundColor:
      COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.lightGray,
  },

  highlightLabel: {
    width: 78,
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.black,
  },

  tabsContainer: {
    height: 51,
    marginTop: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor:
      COLORS.border,
    flexDirection: "row",
  },

  tabButton: {
    flex: 1,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  activeTabLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    backgroundColor:
      COLORS.black,
  },

  emptyState: {
    minHeight: 330,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor:
      COLORS.black,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
  },

  emptySubtitle: {
    marginTop: 7,
    maxWidth: 300,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 8,
    backgroundColor:
      COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
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
    alignSelf: "center",
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
    fontWeight: "700",
    color: COLORS.black,
  },

  menuItem: {
    minHeight: 56,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  menuItemText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.black,
  },

  menuChevron: {
    marginLeft: "auto",
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.black,
  },

  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.blue,
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
    alignItems: "center",
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
    fontWeight: "600",
    color: COLORS.blue,
  },

  editField: {
    marginBottom: 20,
  },

  editLabel: {
    marginBottom: 7,
    fontSize: 13,
    color: COLORS.gray,
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
    color: COLORS.black,
    backgroundColor:
      COLORS.white,
  },

  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  highlightModalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.black,
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
    color: COLORS.black,
  },

  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  selectedCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },

  highlightLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  highlightLoadingText: {
    fontSize: 15,
    color: COLORS.gray,
  },

  storyPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  storyPickerItem: {
    width: "33.3333%",
    aspectRatio: 0.72,
    padding: 1,
    position: "relative",
  },

  storyPickerImage: {
    width: "100%",
    height: "100%",
  },

  storyPickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.lightGray,
  },

  storySelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(0,0,0,0.25)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
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
    alignItems: "center",
    justifyContent: "center",
  },

});