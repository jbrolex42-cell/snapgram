
import { createPost } from "./postService";

export async function uploadMedia(
  uri,
  type = "image"
) {
  if (!uri) {
    throw new Error(
      "Media URI is required."
    );
  }

  const result = await createPost({
    media: [
      {
        uri,
        type:
          type === "video"
            ? "video"
            : "image",
      },
    ],
  });

  return {
    ...result,
    post: result?.post || null,
  };
}