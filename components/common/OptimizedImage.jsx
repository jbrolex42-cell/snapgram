import React, {
  memo,
  useMemo,
  useState,
} from "react";

import { StyleSheet, View } from "react-native";

import { Image } from "expo-image";

import {
  getImageUri,
} from "../../services/performance/imageService";

function OptimizedImage({
  source,
  style,
  contentFit = "cover",
  placeholder,
  transition = 150,
  cachePolicy = "memory-disk",
  recyclingKey,
  onLoad,
  onError,
  ...props
}) {
  const [failed, setFailed] = useState(false);

  const uri = useMemo(
    () => getImageUri(source),
    [source]
  );

  const imageSource = useMemo(() => {
    if (!uri || failed) {
      return null;
    }

    return {
      uri,
    };
  }, [uri, failed]);

  if (!imageSource) {
    return (
      <View
        style={[
          styles.placeholder,
          style,
        ]}
      >
        {placeholder}
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={imageSource}
      style={style}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      transition={transition}
      recyclingKey={recyclingKey || uri}
      onLoad={(event) => {
        setFailed(false);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
  },
});

export default memo(OptimizedImage);