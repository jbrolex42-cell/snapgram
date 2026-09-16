export function getMotionConfig(
  preferences = {}
) {
  const animations =
    preferences.animations !== false;

  const reduceMotion =
    preferences.reduceMotion === true;

  return {
    animations,
    reduceMotion,
    animationsEnabled:
      animations && !reduceMotion,
  };
}

export function getAnimationDuration(
  duration,
  preferences = {}
) {
  const {
    animationsEnabled,
  } = getMotionConfig(preferences);

  if (!animationsEnabled) {
    return 0;
  }

  return duration;
}