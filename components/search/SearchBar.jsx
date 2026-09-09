
import {
    StyleSheet,
    TextInput,
    View,
} from "react-native";

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
}) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        onSubmitEditing={
          onSubmit
        }
        placeholder="Search"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
  },

  input: {
    height: 42,
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
  },
});