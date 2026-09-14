import React, { useCallback, useState } from "react";

import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function MessageSearch({
  onSearch,
  onClose,
}) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (value) => {
      setQuery(value);

      if (typeof onSearch === "function") {
        onSearch(value);
      }
    },
    [onSearch]
  );

  const handleClose = useCallback(() => {
    setQuery("");

    if (typeof onSearch === "function") {
      onSearch("");
    }

    if (typeof onClose === "function") {
      onClose();
    }
  }, [onSearch, onClose]);

  return (
    <View style={styles.container}>

      <View style={styles.searchIconContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#8E8E93"
        />
      </View>

      <TextInput
        autoFocus
        value={query}
        onChangeText={handleChange}
        placeholder="Search"
        placeholderTextColor="#8E8E93"
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />

      {query.length > 0 ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => handleChange("")}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons
            name="close-circle"
            size={19}
            color="#8E8E93"
          />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="Close message search"
      >
        <Ionicons
          name="close"
          size={25}
          color="#111111"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 12,
    marginVertical: 8,

    paddingLeft: 12,
    paddingRight: 4,

    backgroundColor: "#EFEFEF",
    borderRadius: 12,
  },

  searchIconContainer: {
    width: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,

    height: 44,

    paddingHorizontal: 7,
    paddingVertical: 0,

    color: "#111111",
    fontSize: 15,
    fontWeight: "400",
  },

  clearButton: {
    width: 32,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  closeButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },
});