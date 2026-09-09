import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../context/AuthContext";

import {
  updateProfile,
} from "../../services/userService";

import {
  getStories,
} from "../../services/storyService";

import {
  getHighlights,
  createHighlight,
} from "../../services/highlightService";

import VerifiedBadge from "../../components/common/VerifiedBadge";
import ProfileTabs from "../../components/profile/ProfileTabs";
import ProfileGrid from "../../components/profile/ProfileGrid";

/* =========================================================
   COLORS
   ========================================================= */

const BLUE = "#0095F6";
const TEXT = "#000000";
const MUTED = "#737373";
const LIGHT_TEXT = "#8E8E8E";
const BORDER = "#DBDBDB";
const LIGHT_BORDER = "#EFEFEF";
const LIGHT = "#F5F5F5";
const WHITE = "#FFFFFF";
const DANGER = "#ED4956";

/* =========================================================
   PROFILE SCREEN
   ========================================================= */

export default function ProfileScreen() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  /* =======================================================
     PROFILE
     ======================================================= */

  const [profile, setProfile] = useState({
    username: user?.username || "",
    name: user?.name || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    website: user?.website || "",
    pronouns: user?.pronouns || "",
    gender: user?.gender || "",
    isVerified: Boolean(user?.isVerified),
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile({
      username: user.username || "",
      name: user.name || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      website: user.website || "",
      pronouns: user.pronouns || "",
      gender: user.gender || "",
      isVerified: Boolean(user.isVerified),
    });
  }, [user]);

  const currentUserId = String(
    user?._id ||
      user?.id ||
      ""
  );

  /* =======================================================
     MENU
     ======================================================= */

  const [
    menuVisible,
    setMenuVisible,
  ] = useState(false);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  /* =======================================================
     EDIT PROFILE
     ======================================================= */

  const [
    editVisible,
    setEditVisible,
  ] = useState(false);

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editUsername,
    setEditUsername,
  ] = useState("");

  const [
    editBio,
    setEditBio,
  ] = useState("");

  const [
    editWebsite,
    setEditWebsite,
  ] = useState("");

  const [
    editPronouns,
    setEditPronouns,
  ] = useState("");

  const [
    editGender,
    setEditGender,
  ] = useState("");

  const [
    selectedAvatar,
    setSelectedAvatar,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  /* =======================================================
     TABS
     ======================================================= */

  const [
    selectedTab,
    setSelectedTab,
  ] = useState("posts");

  /* =======================================================
     STORIES
     
     Stories are NOT displayed on the profile.
     They are loaded only because Highlights use them.
     ======================================================= */

  const [
    myStories,
    setMyStories,
  ] = useState([]);

  const [
    storiesLoading,
    setStoriesLoading,
  ] = useState(false);

  /* =======================================================
     HIGHLIGHTS
     ======================================================= */

  const [
    highlights,
    setHighlights,
  ] = useState([]);

  const [
    highlightModalVisible,
    setHighlightModalVisible,
  ] = useState(false);

  const [
    highlightTitle,
    setHighlightTitle,
  ] = useState("");

  const [
    selectedStoryIds,
    setSelectedStoryIds,
  ] = useState([]);

  const [
    savingHighlight,
    setSavingHighlight,
  ] = useState(false);

  /* =======================================================
     COUNTS
     ======================================================= */

  const postCount =
    user?.postsCount ??
    user?.postCount ??
    user?.posts?.length ??
    0;

  const followersCount =
    user?.followersCount ??
    user?.followers?.length ??
    0;

  const followingCount =
    user?.followingCount ??
    user?.following?.length ??
    0;

  /* =======================================================
     PROFILE POSTS
     ======================================================= */

  const profilePosts = useMemo(() => {
    const candidates = [
      user?.posts,
      user?.profilePosts,
      user?.recentPosts,
    ];

    const found = candidates.find(
      (item) => Array.isArray(item)
    );

    return Array.isArray(found)
      ? found
      : [];
  }, [user]);

  const reelPosts = useMemo(() => {
    return profilePosts.filter((post) => {
      const type =
        post?.type ||
        post?.mediaType ||
        post?.contentType ||
        "";

      return (
        post?.isReel === true ||
        String(type).toLowerCase() === "reel"
      );
    });
  }, [profilePosts]);

  /* =======================================================
     STORY IMAGE NORMALIZER
     ======================================================= */

  const getStoryImage = useCallback(
    (story) => {
      if (!story) {
        return null;
      }

      return (
        story.mediaUrl ||
        story.media?.url ||
        story.media?.secure_url ||
        story.media?.uri ||
        story.media?.[0]?.url ||
        story.media?.[0]?.secure_url ||
        story.media?.[0]?.uri ||
        story.image ||
        story.imageUrl ||
        story.thumbnail ||
        null
      );
    },
    []
  );

  /* =======================================================
     LOAD MY STORIES
     
     Invisible/background only.
     ======================================================= */

  const loadMyStories = useCallback(
    async () => {
      if (!currentUserId) {
        setMyStories([]);
        return;
      }

      try {
        setStoriesLoading(true);

        const result =
          await getStories();

        const storyList =
          Array.isArray(result)
            ? result
            : result?.stories ||
              result?.data?.stories ||
              result?.data ||
              [];

        const normalized =
          Array.isArray(storyList)
            ? storyList
            : [];

        const mine =
          normalized.filter((item) => {
            const ownerId =
              item?.user?._id ||
              item?.user?.id ||
              item?.userId ||
              item?.author?._id ||
              item?.author?.id;

            return (
              ownerId &&
              String(ownerId) ===
                currentUserId
            );
          });

        setMyStories(mine);
      } catch (error) {
        console.error(
          "PROFILE STORIES LOAD ERROR:",
          error
        );

        setMyStories([]);
      } finally {
        setStoriesLoading(false);
      }
    },
    [currentUserId]
  );

  /* =======================================================
     LOAD HIGHLIGHTS
     ======================================================= */

  const loadHighlights = useCallback(
    async () => {
      if (!currentUserId) {
        setHighlights([]);
        return;
      }

      try {
        const result =
          await getHighlights(
            currentUserId
          );

        const list =
          Array.isArray(result)
            ? result
            : result?.highlights ||
              result?.data?.highlights ||
              result?.data ||
              [];

        setHighlights(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (error) {
        console.error(
          "PROFILE HIGHLIGHTS LOAD ERROR:",
          error
        );

        setHighlights([]);
      }
    },
    [currentUserId]
  );

  /* =======================================================
     REFRESH PROFILE DATA
     ======================================================= */

  useFocusEffect(
    useCallback(() => {
      loadMyStories();
      loadHighlights();
    }, [
      loadMyStories,
      loadHighlights,
    ])
  );

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const openSettings = useCallback(() => {
    closeMenu();
    router.push("/settings");
  }, [closeMenu]);

  const openActivity = useCallback(() => {
    closeMenu();

    router.push(
      "/settings/activity/activity"
    );
  }, [closeMenu]);

  const openSaved = useCallback(() => {
    closeMenu();

    router.push("/saved");
  }, [closeMenu]);

  const openCloseFriends = useCallback(() => {
    closeMenu();

    router.push(
      "/settings/privacy/close-friends"
    );
  }, [closeMenu]);

  const openFavorites = useCallback(() => {
    closeMenu();

    router.push(
      "/settings/privacy/favorites"
    );
  }, [closeMenu]);

  const openNotifications = useCallback(() => {
    closeMenu();

    router.push(
      "/settings/notifications/notifications"
    );
  }, [closeMenu]);

  const openQRCode = useCallback(() => {
    closeMenu();

    Alert.alert(
      "QR code",
      "QR code is ready to be connected to your Snapgram QR screen."
    );
  }, [closeMenu]);

  const openFollowers = useCallback(() => {
    if (!currentUserId) {
      return;
    }

    router.push({
      pathname:
        "/profile/followers",
      params: {
        userId: currentUserId,
      },
    });
  }, [currentUserId]);

  const openFollowing = useCallback(() => {
    if (!currentUserId) {
      return;
    }

    router.push({
      pathname:
        "/profile/following",
      params: {
        userId: currentUserId,
      },
    });
  }, [currentUserId]);

  const createPost = useCallback(() => {
    router.push(
      "/(tabs)/create"
    );
  }, []);

  const openPost = useCallback(
    (post) => {
      const postId =
        post?._id ||
        post?.id;

      if (!postId) {
        return;
      }

      router.push({
        pathname:
          "/post/[id]",
        params: {
          id: String(postId),
        },
      });
    },
    []
  );

  /* =======================================================
     EDIT PROFILE
     ======================================================= */

  const openEditProfile = useCallback(() => {
    /*
     * FIX:
     * Previously this used profile.fullName,
     * but the profile object contains "name".
     */

    setEditName(
      profile.name || ""
    );

    setEditUsername(
      profile.username || ""
    );

    setEditBio(
      profile.bio || ""
    );

    setEditWebsite(
      profile.website || ""
    );

    setEditPronouns(
      profile.pronouns || ""
    );

    setEditGender(
      profile.gender || ""
    );

    setSelectedAvatar(null);
    setEditVisible(true);
  }, [profile]);

  /* =======================================================
     PROFILE PHOTO
     ======================================================= */

  const changeProfilePhoto =
    useCallback(async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission required",
            "Snapgram needs access to your photos."
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

        const asset =
          result.assets[0];

        setSelectedAvatar({
          uri: asset.uri,
          fileName:
            asset.fileName ||
            `snapgram-avatar-${Date.now()}.jpg`,
          mimeType:
            asset.mimeType ||
            "image/jpeg",
        });
      } catch (error) {
        console.error(
          "PROFILE PHOTO ERROR:",
          error
        );

        Alert.alert(
          "Photo error",
          "Unable to select profile photo."
        );
      }
    }, []);

  /* =======================================================
     SAVE PROFILE
     ======================================================= */

  const saveProfile =
    useCallback(async () => {
      const cleanUsername =
        editUsername
          .trim()
          .toLowerCase();

      const cleanName =
        editName.trim();

      const cleanBio =
        editBio.trim();

      const cleanWebsite =
        editWebsite.trim();

      const cleanPronouns =
        editPronouns.trim();

      const cleanGender =
        editGender.trim();

      if (!cleanUsername) {
        Alert.alert(
          "Username required",
          "Please enter a username."
        );

        return;
      }

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
        setSaving(true);

        const updatedUser =
          await updateProfile({
            name: cleanName,
            username:
              cleanUsername,
            bio: cleanBio,
            website:
              cleanWebsite,
            pronouns:
              cleanPronouns,
            gender:
              cleanGender,
            avatar:
              selectedAvatar,
          });

        if (!updatedUser) {
          throw new Error(
            "Profile update returned no user."
          );
        }

        setProfile(
          (previous) => ({
            ...previous,

            username:
              updatedUser.username ??
              cleanUsername,

            name:
              updatedUser.name ??
              cleanName,

            bio:
              updatedUser.bio ??
              cleanBio,

            avatar:
              updatedUser.avatar ??
              previous.avatar,

            website:
              updatedUser.website ??
              cleanWebsite,

            pronouns:
              updatedUser.pronouns ??
              cleanPronouns,

            gender:
              updatedUser.gender ??
              cleanGender,

            isVerified:
              updatedUser.isVerified ??
              previous.isVerified,
          })
        );

        setSelectedAvatar(null);
        setEditVisible(false);

        Alert.alert(
          "Profile updated",
          "Your profile has been saved successfully."
        );
      } catch (error) {
        console.error(
          "SAVE PROFILE ERROR:",
          error
        );

        Alert.alert(
          "Update failed",
          error?.response?.data?.message ||
            error?.message ||
            "Unable to save your profile."
        );
      } finally {
        setSaving(false);
      }
    }, [
      editUsername,
      editName,
      editBio,
      editWebsite,
      editPronouns,
      editGender,
      selectedAvatar,
    ]);

  /* =======================================================
     SHARE PROFILE
     ======================================================= */

  const shareProfile =
    useCallback(async () => {
      try {
        const username =
          profile.username ||
          "snapgram_user";

        await Share.share({
          message:
            `Check out @${username} on Snapgram.`,
        });
      } catch (error) {
        if (
          error?.message !==
          "User did not share"
        ) {
          console.error(
            "SHARE PROFILE ERROR:",
            error
          );
        }
      }
    }, [profile.username]);

  /* =======================================================
     CREATE HIGHLIGHT
     ======================================================= */

  const openCreateHighlight =
    useCallback(() => {
      if (!myStories.length) {
        Alert.alert(
          "No stories yet",
          "Share a story first, then you can add it to a highlight."
        );

        return;
      }

      setHighlightTitle("");
      setSelectedStoryIds([]);
      setHighlightModalVisible(
        true
      );
    }, [myStories.length]);

  const toggleStorySelection =
    useCallback((storyId) => {
      setSelectedStoryIds(
        (previous) =>
          previous.includes(storyId)
            ? previous.filter(
                (id) =>
                  id !== storyId
              )
            : [
                ...previous,
                storyId,
              ]
      );
    }, []);

  const saveHighlight =
    useCallback(async () => {
      const cleanTitle =
        highlightTitle.trim();

      if (!cleanTitle) {
        Alert.alert(
          "Name required",
          "Give your highlight a name."
        );

        return;
      }

      if (
        !selectedStoryIds.length
      ) {
        Alert.alert(
          "Select stories",
          "Choose at least one story to add to this highlight."
        );

        return;
      }

      try {
        setSavingHighlight(true);

        const coverStory =
          myStories.find(
            (story) =>
              String(
                story?._id ||
                  story?.id
              ) ===
              String(
                selectedStoryIds[0]
              )
          );

        const coverUrl =
          getStoryImage(
            coverStory
          );

        const saved =
          await createHighlight({
            title: cleanTitle,
            storyIds:
              selectedStoryIds,
            coverUrl,
          });

        const localHighlight = {
          id:
            saved?.id ||
            saved?._id ||
            `local-${Date.now()}`,

          title:
            saved?.title ||
            cleanTitle,

          coverUrl:
            saved?.coverUrl ??
            coverUrl,

          storyIds:
            saved?.storyIds ||
            selectedStoryIds,
        };

        setHighlights(
          (previous) => [
            ...previous,
            localHighlight,
          ]
        );

        setHighlightTitle("");
        setSelectedStoryIds([]);
        setHighlightModalVisible(
          false
        );
      } catch (error) {
        console.error(
          "SAVE HIGHLIGHT ERROR:",
          error
        );

        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            "Unable to create highlight."
        );
      } finally {
        setSavingHighlight(false);
      }
    }, [
      highlightTitle,
      selectedStoryIds,
      myStories,
      getStoryImage,
    ]);

  /* =======================================================
     OPEN HIGHLIGHT
     ======================================================= */

  const openHighlight =
    useCallback((highlight) => {
      const firstStoryId =
        highlight?.storyIds?.[0];

      if (!firstStoryId) {
        return;
      }

      const storyId =
        typeof firstStoryId ===
        "object"
          ? firstStoryId?._id ||
            firstStoryId?.id
          : firstStoryId;

      if (!storyId) {
        return;
      }

      router.push({
        pathname:
          "/stories/[id]",
        params: {
          id: String(storyId),
        },
      });
    }, []);

  /* =======================================================
     CONTENT
     ======================================================= */

  const renderContent =
    useCallback(() => {
      if (
        selectedTab ===
        "posts"
      ) {
        if (
          profilePosts.length
        ) {
          return (
            <ProfileGrid
              posts={
                profilePosts
              }
              onPostPress={
                openPost
              }
              emptyMessage="No posts yet"
            />
          );
        }

        return (
          <EmptyProfileState
            icon="camera-outline"
            title="No posts yet"
            message="Share your first photo or video on Snapgram."
            buttonLabel="Create post"
            onPress={
              createPost
            }
          />
        );
      }

      if (
        selectedTab ===
        "reels"
      ) {
        if (
          reelPosts.length
        ) {
          return (
            <ProfileGrid
              posts={
                reelPosts
              }
              onPostPress={
                openPost
              }
              emptyMessage="No reels yet"
            />
          );
        }

        return (
          <EmptyProfileState
            icon="play-circle-outline"
            title="No reels yet"
            message="Your reels will appear here."
            buttonLabel="Create reel"
            onPress={
              createPost
            }
          />
        );
      }

      if (
        selectedTab ===
        "saved"
      ) {
        return (
          <EmptyProfileState
            icon="bookmark-outline"
            title="Saved"
            message="Posts and reels you save will appear here."
            buttonLabel="Open saved"
            onPress={
              openSaved
            }
          />
        );
      }

      return (
        <EmptyProfileState
          icon="person-outline"
          title="Tagged posts"
          message="Posts you're tagged in will appear here."
        />
      );
    }, [
      selectedTab,
      profilePosts,
      reelPosts,
      openPost,
      createPost,
      openSaved,
    ]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (authLoading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="small"
          color={TEXT}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const displayAvatar =
    selectedAvatar?.uri ||
    profile.avatar;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <View
      style={styles.container}
    >
      {/* ===================================================
          HEADER
          =================================================== */}

      <View
        style={styles.header}
      >
        <Text
          style={
            styles.headerUsername
          }
          numberOfLines={1}
        >
          {profile.username ||
            "snapgram_user"}
        </Text>

        <View
          style={
            styles.headerActions
          }
        >
          <TouchableOpacity
            onPress={
              openEditProfile
            }
            activeOpacity={0.7}
            style={
              styles.headerButton
            }
            hitSlop={10}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={TEXT}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openMenu}
            activeOpacity={0.7}
            style={
              styles.headerButton
            }
            hitSlop={10}
          >
            <Ionicons
              name="menu-outline"
              size={28}
              color={TEXT}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================================================
          PROFILE SCROLL
          =================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* =================================================
            PROFILE HEADER
            ================================================= */}

        <View
          style={
            styles.profileHeader
          }
        >
          {/* Avatar */}

          <TouchableOpacity
            onPress={
              openEditProfile
            }
            activeOpacity={0.9}
            style={
              styles.avatarTouch
            }
          >
            <View
              style={
                styles.avatarOuter
              }
            >
              <View
                style={
                  styles.avatar
                }
              >
                {displayAvatar ? (
                  <Image
                    source={{
                      uri:
                        displayAvatar,
                    }}
                    style={
                      styles.avatarImage
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.avatarPlaceholder
                    }
                  >
                    <Ionicons
                      name="person"
                      size={42}
                      color="#A0A0A0"
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Stats */}

          <View
            style={styles.stats}
          >
            <ProfileStat
              value={postCount}
              label="posts"
            />

            <ProfileStat
              value={
                followersCount
              }
              label="followers"
              onPress={
                openFollowers
              }
            />

            <ProfileStat
              value={
                followingCount
              }
              label="following"
              onPress={
                openFollowing
              }
            />
          </View>
        </View>

        {/* =================================================
            BIO
            ================================================= */}

        <View
          style={styles.bioSection}
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {profile.name ||
                "Snapgram User"}
            </Text>

            {profile.isVerified ? (
              <VerifiedBadge
                size={17}
                style={
                  styles.verifiedBadge
                }
              />
            ) : null}
          </View>

          {profile.pronouns ? (
            <Text
              style={
                styles.pronouns
              }
            >
              {profile.pronouns}
            </Text>
          ) : null}

          {profile.bio ? (
            <Text
              style={styles.bio}
            >
              {profile.bio}
            </Text>
          ) : null}

          {profile.website ? (
            <Text
              style={
                styles.website
              }
              numberOfLines={1}
            >
              {profile.website}
            </Text>
          ) : null}
        </View>

        {/* =================================================
            PROFILE BUTTONS
            ================================================= */}

        <View
          style={
            styles.profileActions
          }
        >
          <TouchableOpacity
            style={
              styles.profileButton
            }
            onPress={
              openEditProfile
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
            style={
              styles.profileButton
            }
            onPress={
              shareProfile
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
        </View>

        {/* =================================================
            HIGHLIGHTS
            ================================================= */}

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
              styles.highlightsScroll
            }
          >
            {/* NEW HIGHLIGHT */}

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
                style={
                  styles.newHighlightCircle
                }
              >
                <Ionicons
                  name="add"
                  size={28}
                  color={TEXT}
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

            {/* EXISTING HIGHLIGHTS */}

            {highlights.map(
              (
                item,
                index
              ) => {
                const id =
                  String(
                    item?.id ||
                      item?._id ||
                      `highlight-${index}`
                  );

                const cover =
                  item?.coverUrl ||
                  item?.cover?.url ||
                  item?.cover?.secure_url ||
                  item?.image ||
                  null;

                return (
                  <TouchableOpacity
                    key={id}
                    style={
                      styles.highlightItem
                    }
                    onPress={() =>
                      openHighlight(
                        item
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
                            uri:
                              cover,
                          }}
                          style={
                            styles.highlightImage
                          }
                        />
                      ) : (
                        <Ionicons
                          name="images-outline"
                          size={25}
                          color="#777"
                        />
                      )}
                    </View>

                    <Text
                      style={
                        styles.highlightLabel
                      }
                      numberOfLines={1}
                    >
                      {item?.title ||
                        "Highlight"}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* =================================================
            PROFILE TABS
            ================================================= */}

        <ProfileTabs
          activeTab={
            selectedTab
          }
          onChange={
            setSelectedTab
          }
          showReels
          showTagged
        />

        {/* =================================================
            TAB CONTENT
            ================================================= */}

        {renderContent()}
      </ScrollView>

      {/* ===================================================
          INSTAGRAM-STYLE MENU
          =================================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={
          closeMenu
        }
      >
        <View
          style={
            styles.menuOverlay
          }
        >
          {/* Tap outside */}

          <Pressable
            style={
              styles.menuBackdrop
            }
            onPress={
              closeMenu
            }
          />

          {/* Bottom sheet */}

          <View
            style={
              styles.menuSheet
            }
          >
            <View
              style={
                styles.menuHandle
              }
            />

            {/* Settings */}

            <MenuItem
              icon="settings-outline"
              title="Settings and activity"
              onPress={
                openSettings
              }
            />

            {/* Activity */}

            <MenuItem
              icon="time-outline"
              title="Your activity"
              onPress={
                openActivity
              }
            />

            {/* Saved */}

            <MenuItem
              icon="bookmark-outline"
              title="Saved"
              onPress={
                openSaved
              }
            />

            {/* Close Friends */}

            <MenuItem
              icon="people-outline"
              title="Close friends"
              onPress={
                openCloseFriends
              }
            />

            {/* Favorites */}

            <MenuItem
              icon="star-outline"
              title="Favorites"
              onPress={
                openFavorites
              }
            />

            {/* QR */}

            <MenuItem
              icon="qr-code-outline"
              title="QR code"
              onPress={
                openQRCode
              }
            />

            {/* Notifications */}

            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={
                openNotifications
              }
            />

            {/* Cancel */}

            <TouchableOpacity
              style={
                styles.menuCancel
              }
              onPress={
                closeMenu
              }
              activeOpacity={0.7}
            >
              <Text
                style={
                  styles.menuCancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          EDIT PROFILE MODAL
          =================================================== */}

      <Modal
        visible={
          editVisible
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          !saving &&
          setEditVisible(false)
        }
      >
        <View
          style={
            styles.modalContainer
          }
        >
          <View
            style={
              styles.modalHeader
            }
          >
            <TouchableOpacity
              onPress={() =>
                !saving &&
                setEditVisible(
                  false
                )
              }
              disabled={
                saving
              }
              hitSlop={10}
            >
              <Text
                style={
                  styles.modalCancel
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.modalTitle
              }
            >
              Edit profile
            </Text>

            <TouchableOpacity
              onPress={
                saveProfile
              }
              disabled={
                saving
              }
              hitSlop={10}
            >
              <Text
                style={[
                  styles.modalSave,
                  saving &&
                    styles.disabled,
                ]}
              >
                {saving
                  ? "Saving..."
                  : "Done"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.form
            }
          >
            {/* PROFILE PHOTO */}

            <TouchableOpacity
              style={
                styles.photoEditor
              }
              onPress={
                changeProfilePhoto
              }
              disabled={
                saving
              }
              activeOpacity={0.8}
            >
              <View
                style={
                  styles.editAvatarWrapper
                }
              >
                <View
                  style={
                    styles.editAvatar
                  }
                >
                  {selectedAvatar?.uri ||
                  profile.avatar ? (
                    <Image
                      source={{
                        uri:
                          selectedAvatar?.uri ||
                          profile.avatar,
                      }}
                      style={
                        styles.editAvatarImage
                      }
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={45}
                      color="#999"
                    />
                  )}
                </View>

                <View
                  style={
                    styles.editCameraBadge
                  }
                >
                  <Ionicons
                    name="camera"
                    size={15}
                    color={WHITE}
                  />
                </View>
              </View>

              <Text
                style={
                  styles.changePhoto
                }
              >
                Change profile photo
              </Text>
            </TouchableOpacity>

            <EditField
              label="Name"
              value={
                editName
              }
              onChangeText={
                setEditName
              }
              placeholder="Your full name"
            />

            <EditField
              label="Username"
              value={
                editUsername
              }
              onChangeText={
                setEditUsername
              }
              placeholder="Username"
              autoCapitalize="none"
            />

            <EditField
              label="Bio"
              value={
                editBio
              }
              onChangeText={
                setEditBio
              }
              placeholder="Write something about yourself..."
              multiline
              maxLength={150}
            />

            <EditField
              label="Links"
              value={
                editWebsite
              }
              onChangeText={
                setEditWebsite
              }
              placeholder="Add a website or link"
              keyboardType="url"
              autoCapitalize="none"
            />

            <EditField
              label="Pronouns"
              value={
                editPronouns
              }
              onChangeText={
                setEditPronouns
              }
              placeholder="Add your pronouns"
            />

            <EditField
              label="Gender"
              value={
                editGender
              }
              onChangeText={
                setEditGender
              }
              placeholder="Add your gender"
            />

            {profile.isVerified ? (
              <View
                style={
                  styles.verifiedInfo
                }
              >
                <VerifiedBadge
                  size={20}
                />

                <View
                  style={
                    styles.verifiedInfoCopy
                  }
                >
                  <Text
                    style={
                      styles.verifiedInfoTitle
                    }
                  >
                    Verified account
                  </Text>

                  <Text
                    style={
                      styles.verifiedInfoText
                    }
                  >
                    Your account is verified.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* SETTINGS LINK */}

            <TouchableOpacity
              style={
                styles.settingsLink
              }
              onPress={() => {
                if (saving) {
                  return;
                }

                setEditVisible(
                  false
                );

                router.push(
                  "/settings"
                );
              }}
              disabled={
                saving
              }
              activeOpacity={0.7}
            >
              <View
                style={
                  styles.settingsLinkLeft
                }
              >
                <View
                  style={
                    styles.settingsLinkIcon
                  }
                >
                  <Ionicons
                    name="settings-outline"
                    size={19}
                    color={TEXT}
                  />
                </View>

                <Text
                  style={
                    styles.settingsLinkText
                  }
                >
                  Settings and activity
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#999"
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ===================================================
          NEW HIGHLIGHT MODAL
          =================================================== */}

      <Modal
        visible={
          highlightModalVisible
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          !savingHighlight &&
          setHighlightModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalContainer
          }
        >
          <View
            style={
              styles.modalHeader
            }
          >
            <TouchableOpacity
              onPress={() =>
                !savingHighlight &&
                setHighlightModalVisible(
                  false
                )
              }
              disabled={
                savingHighlight
              }
              hitSlop={10}
            >
              <Text
                style={
                  styles.modalCancel
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.modalTitle
              }
            >
              New highlight
            </Text>

            <TouchableOpacity
              onPress={
                saveHighlight
              }
              disabled={
                savingHighlight
              }
              hitSlop={10}
            >
              <Text
                style={[
                  styles.modalSave,
                  savingHighlight &&
                    styles.disabled,
                ]}
              >
                {savingHighlight
                  ? "Saving..."
                  : "Done"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.form
            }
          >
            <EditField
              label="Name"
              value={
                highlightTitle
              }
              onChangeText={
                setHighlightTitle
              }
              placeholder="Highlight name"
              maxLength={16}
            />

            <View
              style={
                styles.selectStoriesHeader
              }
            >
              <Text
                style={
                  styles.fieldLabel
                }
              >
                Select stories
              </Text>

              {selectedStoryIds.length >
              0 ? (
                <Text
                  style={
                    styles.selectedCount
                  }
                >
                  {
                    selectedStoryIds.length
                  }{" "}
                  selected
                </Text>
              ) : null}
            </View>

            {storiesLoading ? (
              <View
                style={
                  styles.storyGridLoading
                }
              >
                <ActivityIndicator
                  color={TEXT}
                />

                <Text
                  style={
                    styles.loadingSmallText
                  }
                >
                  Loading stories...
                </Text>
              </View>
            ) : myStories.length ? (
              <View
                style={
                  styles.storyGrid
                }
              >
                {myStories.map(
                  (story) => {
                    const storyId =
                      String(
                        story?._id ||
                          story?.id
                      );

                    const uri =
                      getStoryImage(
                        story
                      );

                    const selected =
                      selectedStoryIds.includes(
                        storyId
                      );

                    return (
                      <TouchableOpacity
                        key={
                          storyId
                        }
                        style={
                          styles.storyGridItem
                        }
                        onPress={() =>
                          toggleStorySelection(
                            storyId
                          )
                        }
                        activeOpacity={0.8}
                      >
                        {uri ? (
                          <Image
                            source={{
                              uri,
                            }}
                            style={
                              styles.storyGridImage
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.storyGridPlaceholder
                            }
                          >
                            <Ionicons
                              name="image-outline"
                              size={25}
                              color="#999"
                            />
                          </View>
                        )}

                        {selected ? (
                          <View
                            style={
                              styles.storySelectedOverlay
                            }
                          >
                            <View
                              style={
                                styles.storySelectedCircle
                              }
                            >
                              <Ionicons
                                name="checkmark"
                                size={15}
                                color={
                                  WHITE
                                }
                              />
                            </View>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            ) : (
              <View
                style={
                  styles.modalEmptyState
                }
              >
                <Ionicons
                  name="images-outline"
                  size={42}
                  color="#999"
                />

                <Text
                  style={
                    styles.modalEmptyTitle
                  }
                >
                  No stories available
                </Text>

                <Text
                  style={
                    styles.modalEmptyText
                  }
                >
                  Share a story first, then add it to a highlight.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ===========================================================
   MENU ITEM
   =========================================================== */

function MenuItem({
  icon,
  title,
  onPress,
  danger = false,
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View
        style={[
          styles.menuIcon,
          danger &&
            styles.menuIconDanger,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            danger
              ? DANGER
              : TEXT
          }
        />
      </View>

      <Text
        style={[
          styles.menuItemText,
          danger &&
            styles.menuItemDanger,
        ]}
      >
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#A8A8A8"
      />
    </TouchableOpacity>
  );
}

/* ===========================================================
   PROFILE STAT
   =========================================================== */

function ProfileStat({
  value,
  label,
  onPress,
}) {
  const content = (
    <>
      <Text
        style={
          styles.statNumber
        }
      >
        {formatCount(value)}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={styles.stat}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.stat}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
}

/* ===========================================================
   EMPTY PROFILE STATE
   =========================================================== */

function EmptyProfileState({
  icon,
  title,
  message,
  buttonLabel,
  onPress,
}) {
  return (
    <View
      style={
        styles.emptyState
      }
    >
      <View
        style={
          styles.emptyIconCircle
        }
      >
        <Ionicons
          name={icon}
          size={34}
          color={TEXT}
        />
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        {message}
      </Text>

      {buttonLabel &&
      onPress ? (
        <TouchableOpacity
          style={
            styles.primaryButton
          }
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ===========================================================
   EDIT FIELD
   =========================================================== */

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  keyboardType,
  autoCapitalize = "sentences",
}) {
  return (
    <View
      style={styles.field}
    >
      <View
        style={
          styles.fieldLabelRow
        }
      >
        <Text
          style={
            styles.fieldLabel
          }
        >
          {label}
        </Text>

        {maxLength ? (
          <Text
            style={
              styles.characterCount
            }
          >
            {value.length}/
            {maxLength}
          </Text>
        ) : null}
      </View>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#A0A0A0"
        multiline={
          multiline
        }
        maxLength={
          maxLength
        }
        keyboardType={
          keyboardType
        }
        autoCapitalize={
          autoCapitalize
        }
        autoCorrect={false}
        textAlignVertical={
          multiline
            ? "top"
            : "center"
        }
        style={[
          styles.fieldInput,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

/* ===========================================================
   COUNT FORMATTER
   =========================================================== */

function formatCount(value) {
  const number =
    Number(value) || 0;

  if (number >= 1000000) {
    const formatted =
      number / 1000000;

    return `${formatted
      .toFixed(
        formatted >= 10
          ? 0
          : 1
      )
      .replace(
        /\.0$/,
        ""
      )}M`;
  }

  if (number >= 1000) {
    const formatted =
      number / 1000;

    return `${formatted
      .toFixed(
        formatted >= 10
          ? 0
          : 1
      )
      .replace(
        /\.0$/,
        ""
      )}K`;
  }

  return String(number);
}

/* ===========================================================
   STYLES
   =========================================================== */

const styles =
  StyleSheet.create({
    /* =======================================================
       GENERAL
       ======================================================= */

    container: {
      flex: 1,
      backgroundColor: WHITE,
    },

    loadingScreen: {
      flex: 1,
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: MUTED,
    },

    loadingSmallText: {
      marginTop: 8,
      fontSize: 12,
      color: MUTED,
    },

    scrollContent: {
      paddingBottom: 30,
    },

    /* =======================================================
       HEADER
       ======================================================= */

    header: {
      height: 48,
      paddingHorizontal: 12,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        LIGHT_BORDER,
      backgroundColor: WHITE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    headerUsername: {
      flex: 1,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "700",
      color: TEXT,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },

    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    /* =======================================================
       PROFILE HEADER
       ======================================================= */

    profileHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      flexDirection: "row",
      alignItems: "center",
    },

    avatarTouch: {
      width: 86,
      height: 86,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarOuter: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: "#EFEFEF",
      alignItems: "center",
      justifyContent: "center",
    },

    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      overflow: "hidden",
      backgroundColor: "#EFEFEF",
      borderWidth: 2,
      borderColor: WHITE,
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EFEFEF",
    },

    /* =======================================================
       STATS
       ======================================================= */

    stats: {
      flex: 1,
      marginLeft: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    stat: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    statNumber: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "700",
      color: TEXT,
    },

    statLabel: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 17,
      color: TEXT,
    },

    /* =======================================================
       BIO
       ======================================================= */

    bioSection: {
      paddingHorizontal: 16,
      marginTop: 12,
    },

    nameRow: {
      minHeight: 21,
      flexDirection: "row",
      alignItems: "center",
    },

    name: {
      maxWidth: "90%",
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "700",
      color: TEXT,
    },

    verifiedBadge: {
      marginLeft: 5,
    },

    pronouns: {
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      color: MUTED,
    },

    bio: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 19,
      color: TEXT,
    },

    website: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
      color: "#00376B",
    },

    /* =======================================================
       PROFILE BUTTONS
       ======================================================= */

    profileActions: {
      paddingHorizontal: 16,
      marginTop: 14,
      flexDirection: "row",
    },

    profileButton: {
      flex: 1,
      height: 36,
      marginRight: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: "#FAFAFA",
      alignItems: "center",
      justifyContent: "center",
    },

    profileButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: TEXT,
    },

    /* =======================================================
       HIGHLIGHTS
       ======================================================= */

    highlightsSection: {
      marginTop: 18,
      minHeight: 101,
    },

    highlightsScroll: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 4,
    },

    highlightItem: {
      width: 70,
      marginRight: 15,
      alignItems: "center",
    },

    highlightCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: "#F7F7F7",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },

    newHighlightCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },

    highlightImage: {
      width: "100%",
      height: "100%",
    },

    highlightLabel: {
      width: 70,
      marginTop: 5,
      fontSize: 11,
      lineHeight: 15,
      color: TEXT,
      textAlign: "center",
    },

    /* =======================================================
       EMPTY CONTENT
       ======================================================= */

    emptyState: {
      minHeight: 320,
      paddingHorizontal: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 1.5,
      borderColor: TEXT,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "700",
      color: TEXT,
      textAlign: "center",
    },

    emptyText: {
      maxWidth: 310,
      marginTop: 7,
      fontSize: 13,
      lineHeight: 19,
      color: MUTED,
      textAlign: "center",
    },

    primaryButton: {
      minHeight: 36,
      marginTop: 17,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: BLUE,
      alignItems: "center",
      justifyContent: "center",
    },

    primaryButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: WHITE,
    },

    /* =======================================================
       MENU OVERLAY
       ======================================================= */

    menuOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.38)",
    },

    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },

    menuSheet: {
      backgroundColor: WHITE,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 9,
      paddingBottom: 26,
      overflow: "hidden",
    },

    menuHandle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#D0D0D0",
      marginBottom: 8,
    },

    menuItem: {
      minHeight: 57,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        "#F0F0F0",
    },

    menuIcon: {
      width: 34,
      alignItems: "flex-start",
      justifyContent: "center",
    },

    menuIconDanger: {
      opacity: 0.95,
    },

    menuItemText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 15,
      color: TEXT,
      fontWeight: "500",
    },

    menuItemDanger: {
      color: DANGER,
    },

    menuCancel: {
      height: 52,
      marginTop: 7,
      alignItems: "center",
      justifyContent: "center",
      borderTopWidth: 6,
      borderTopColor: "#F6F6F6",
    },

    menuCancelText: {
      fontSize: 15,
      color: TEXT,
      fontWeight: "600",
    },

    /* =======================================================
       MODAL
       ======================================================= */

    modalContainer: {
      flex: 1,
      backgroundColor: WHITE,
    },

    modalHeader: {
      height: 56,
      paddingHorizontal: 16,
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        BORDER,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    modalCancel: {
      width: 65,
      fontSize: 14,
      color: TEXT,
    },

    modalTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
      color: TEXT,
    },

    modalSave: {
      width: 65,
      textAlign: "right",
      fontSize: 14,
      fontWeight: "700",
      color: BLUE,
    },

    disabled: {
      opacity: 0.4,
    },

    form: {
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 50,
    },

    /* =======================================================
       EDIT AVATAR
       ======================================================= */

    photoEditor: {
      alignItems: "center",
      marginBottom: 28,
    },

    editAvatarWrapper: {
      width: 100,
      height: 100,
      position: "relative",
    },

    editAvatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      overflow: "hidden",
      backgroundColor: "#EFEFEF",
      alignItems: "center",
      justifyContent: "center",
    },

    editAvatarImage: {
      width: "100%",
      height: "100%",
    },

    editCameraBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 29,
      height: 29,
      borderRadius: 15,
      backgroundColor: TEXT,
      borderWidth: 2,
      borderColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },

    changePhoto: {
      marginTop: 10,
      fontSize: 14,
      fontWeight: "600",
      color: BLUE,
    },

    /* =======================================================
       FORM
       ======================================================= */

    field: {
      marginBottom: 18,
    },

    fieldLabelRow: {
      marginBottom: 7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: "#444",
    },

    characterCount: {
      fontSize: 11,
      color: "#999",
    },

    fieldInput: {
      minHeight: 48,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 8,
      backgroundColor: "#FAFAFA",
      fontSize: 15,
      color: TEXT,
    },

    multilineInput: {
      minHeight: 105,
      paddingTop: 12,
      paddingBottom: 12,
    },

    /* =======================================================
       VERIFIED
       ======================================================= */

    verifiedInfo: {
      minHeight: 60,
      paddingHorizontal: 13,
      paddingVertical: 10,
      marginBottom: 17,
      borderRadius: 10,
      backgroundColor: "#F4F9FF",
      flexDirection: "row",
      alignItems: "center",
    },

    verifiedInfoCopy: {
      flex: 1,
      marginLeft: 10,
    },

    verifiedInfoTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#1677D2",
    },

    verifiedInfoText: {
      marginTop: 2,
      fontSize: 12,
      color: "#4E83B4",
    },

    /* =======================================================
       SETTINGS LINK
       ======================================================= */

    settingsLink: {
      minHeight: 56,
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#EEEEEE",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    settingsLinkLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    settingsLinkIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#F3F3F3",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    settingsLinkText: {
      fontSize: 14,
      fontWeight: "600",
      color: TEXT,
    },

    /* =======================================================
       HIGHLIGHT CREATION
       ======================================================= */

    selectStoriesHeader: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    selectedCount: {
      fontSize: 12,
      fontWeight: "700",
      color: BLUE,
    },

    storyGridLoading: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
    },

    storyGrid: {
      marginTop: 12,
      flexDirection: "row",
      flexWrap: "wrap",
    },

    storyGridItem: {
      width: "31.8%",
      aspectRatio: 1,
      marginRight: "2.3%",
      marginBottom: 8,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: "#EFEFEF",
      position: "relative",
    },

    storyGridImage: {
      width: "100%",
      height: "100%",
    },

    storyGridPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    storySelectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.18)",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      padding: 6,
    },

    storySelectedCircle: {
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: BLUE,
      borderWidth: 2,
      borderColor: WHITE,
      alignItems: "center",
      justifyContent: "center",
    },

    modalEmptyState: {
      minHeight: 240,
      paddingHorizontal: 25,
      alignItems: "center",
      justifyContent: "center",
    },

    modalEmptyTitle: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "700",
      color: TEXT,
    },

    modalEmptyText: {
      maxWidth: 290,
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: MUTED,
      textAlign: "center",
    },
  });