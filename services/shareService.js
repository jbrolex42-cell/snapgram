import {
    Share,
} from "react-native";

export async function sharePost(
  post
) {
  const username =
    post.user?.username ||
    "Snapgram user";

  const message =
    `${username} shared a post on Snapgram`;

  try {
    await Share.share({
      message,
    });
  } catch (error) {
    console.error(
      "Share error:",
      error
    );
  }
}