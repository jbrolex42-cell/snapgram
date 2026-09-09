import api from "./api";

export async function getComments(
  postId
) {
  const response = await api.get(
    `/comments/post/${postId}`
  );

  return response.data.comments;
}

export async function createComment(
  postId,
  text,
  parentComment = null
) {
  const response = await api.post(
    `/comments/post/${postId}`,
    {
      text,
      parentComment,
    }
  );

  return response.data.comment;
}

export async function deleteComment(
  commentId
) {
  const response = await api.delete(
    `/comments/${commentId}`
  );

  return response.data;
}

export async function likeComment(
  commentId
) {
  const response = await api.post(
    `/comments/${commentId}/like`
  );

  return response.data;
}

export async function unlikeComment(
  commentId
) {
  const response = await api.delete(
    `/comments/${commentId}/like`
  );

  return response.data;
}