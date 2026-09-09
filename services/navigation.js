import {
    router,
} from "expo-router";

export function openIncomingCall(
  data
) {
  router.push({
    pathname:
      "/calls/incoming",

    params: {
      callId:
        data.callId,

      callerId:
        data.callerId,

      callerName:
        data.callerName,

      callerAvatar:
        data.callerAvatar,

      type:
        data.callType,
    },
  });
}