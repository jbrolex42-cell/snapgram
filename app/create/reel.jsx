import React, { useEffect } from "react";

import {
ActivityIndicator,
StyleSheet,
Text,
View,
} from "react-native";

import {
router,
useLocalSearchParams,
} from "expo-router";

export default function ReelScreen() {
const params = useLocalSearchParams();

useEffect(() => {

router.replace({
pathname: "/create/editor",
params: {
media: params.media || "",
mode: "reel",
},
});
}, [params.media]);

return ( <View style={styles.container}> <ActivityIndicator
     size="large"
     color="#0095f6"
   />

  <Text style={styles.text}>
    Opening reel editor...
  </Text>
</View>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
alignItems: "center",
justifyContent: "center",
backgroundColor: "#fff",
},

text: {
marginTop: 14,
fontSize: 14,
fontWeight: "600",
color: "#666",
},
});