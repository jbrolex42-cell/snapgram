import * as ImageManipulator from "expo-image-manipulator";

const JPEG = ImageManipulator.SaveFormat.JPEG;

export async function rotateImage(uri, degrees = 90) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ rotate: degrees }],
    {
      compress: 0.95,
      format: JPEG,
    }
  );

  return result.uri;
}

export async function cropToRatio(uri, ratio) {
  if (ratio === "original") {
    return uri;
  }

  const image = await ImageManipulator.manipulateAsync(
    uri,
    [],
    {}
  );

  const width = image.width;
  const height = image.height;

  let cropWidth = width;
  let cropHeight = height;

  if (ratio === "1:1") {
    const size = Math.min(width, height);

    cropWidth = size;
    cropHeight = size;
  }

  if (ratio === "4:5") {
    if (width / height > 4 / 5) {
      cropHeight = height;
      cropWidth = height * (4 / 5);
    } else {
      cropWidth = width;
      cropHeight = width * (5 / 4);
    }
  }

  if (ratio === "16:9") {
    if (width / height > 16 / 9) {
      cropHeight = height;
      cropWidth = height * (16 / 9);
    } else {
      cropWidth = width;
      cropHeight = width * (9 / 16);
    }
  }

  const originX = (width - cropWidth) / 2;
  const originY = (height - cropHeight) / 2;

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        crop: {
          originX: Math.round(originX),
          originY: Math.round(originY),
          width: Math.round(cropWidth),
          height: Math.round(cropHeight),
        },
      },
    ],
    {
      compress: 0.95,
      format: JPEG,
    }
  );

  return result.uri;
}