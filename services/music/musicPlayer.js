import {
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";

let activePlayer = null;

export async function configureMusicAudio() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
    });
  } catch (error) {
    console.warn(
      "[MUSIC PLAYER] Audio configuration failed:",
      error?.message
    );
  }
}

export function createMusicPlayer(uri) {
  if (!uri) {
    return null;
  }

  stopMusic();

  activePlayer = createAudioPlayer(uri);

  return activePlayer;
}

export function getActiveMusicPlayer() {
  return activePlayer;
}

export function playMusic() {
  activePlayer?.play();
}

export function pauseMusic() {
  activePlayer?.pause();
}

export async function seekMusic(seconds) {
  if (!activePlayer) {
    return;
  }

  await activePlayer.seekTo(
    Math.max(Number(seconds) || 0, 0)
  );
}

export function stopMusic() {
  if (!activePlayer) {
    return;
  }

  try {
    activePlayer.pause();
    activePlayer.remove();
  } catch (error) {
    console.warn(
      "[MUSIC PLAYER] Cleanup failed:",
      error?.message
    );
  }

  activePlayer = null;
}

export function setMusicVolume(volume = 1) {
  if (!activePlayer) {
    return;
  }

  activePlayer.volume = Math.max(
    0,
    Math.min(Number(volume) || 0, 1)
  );
}