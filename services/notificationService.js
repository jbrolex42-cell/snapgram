import api from "./api";
import * as Notifications from "expo-notifications";

export async function getNotifications() {
  const response = await api.get(
    "/notifications"
  );

  return response.data?.notifications || [];
}

export async function getUnreadNotificationCount() {
  const response = await api.get(
    "/notifications/unread-count"
  );

  return response.data?.count || 0;
}

export async function getUnreadCount() {
  return getUnreadNotificationCount();
}

export async function markNotificationRead(id) {
  const response = await api.patch(
    `/notifications/${id}/read`
  );

  return response.data?.notification;
}

export async function markAllNotificationsRead() {
  const response = await api.patch(
    "/notifications/read-all"
  );

  return response.data;
}

export async function showIncomingCallNotification({
  callerName,
  callType,
  callId,
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          callType === "video"
            ? "📹 Incoming video call"
            : "📞 Incoming voice call",

        body: `${callerName} is calling you`,

        data: {
          type: "incoming-call",
          callId,
          callType,
        },

        sound: "default",
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

Notifications.addNotificationResponseReceivedListener(
  (response) => {
    const data =
      response.notification
        ?.request
        ?.content
        ?.data;

    if (
      data?.type !== "incoming-call"
    ) {
      return;
    }

    console.log(
      "CALL NOTIFICATION TAPPED:",
      data
    );
  }
);