import api from "./api";
import * as Notifications from "expo-notifications";

export async function getNotifications() {
  try {
    const response = await api.get("/notifications");

    return Array.isArray(response.data?.notifications)
      ? response.data.notifications
      : [];
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    throw error;
  }
}

export async function getUnreadNotificationCount() {
  try {
    const response = await api.get("/notifications/unread-count");

    return Number(response.data?.count || 0);
  } catch (error) {
    console.error("GET UNREAD NOTIFICATION COUNT ERROR:", error);
    return 0;
  }
}

export async function getUnreadCount() {
  return getUnreadNotificationCount();
}

export async function markNotificationRead(id) {
  if (!id) {
    throw new Error("Notification ID is required.");
  }

  try {
    const response = await api.patch(
      `/notifications/${encodeURIComponent(id)}/read`
    );

    return response.data?.notification || null;
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
    throw error;
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await api.patch("/notifications/read-all");

    return response.data || {};
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    throw error;
  }
}

export async function showIncomingCallNotification({
  callerName = "Someone",
  callerId = null,
  callerAvatar = null,
  callType = "voice",
  callId,
}) {
  try {
    if (!callId) {
      console.warn(
        "CALL NOTIFICATION: Missing callId."
      );
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          callType === "video"
            ? "📹 Incoming video call"
            : "📞 Incoming voice call",

        body: `${callerName} is calling you`,

        sound: "default",

        data: {
          type: "incoming-call",
          callId: callId || null,
          callerId: callerId || null,
          callerName: callerName || "Someone",
          callerAvatar: callerAvatar || null,
          username: callerName || "Someone",
          avatar: callerAvatar || null,
          callType: callType || "voice",
          typeOfCall: callType || "voice",
        },
      },

      trigger: null,
    });
  } catch (error) {
    console.error(
      "CALL NOTIFICATION ERROR:",
      error
    );
  }
}

export function getNotificationResponseData(response) {
  return (
    response?.notification?.request?.content?.data || null
  );
}