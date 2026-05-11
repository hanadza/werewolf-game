const sounds = {};
let globalVolume = 0.4;
const soundFiles = ['siang','senja','malam','wolf','eliminated','vote','win','lose','countdown','join','transition'];
soundFiles.forEach(name => {
  sounds[name] = new Audio(`/sounds/${name}.mp3`);
  sounds[name].volume = globalVolume;
  sounds[name].onerror = () => {};
});

export const setVolume = (vol) => {
  globalVolume = Math.max(0, Math.min(1, vol));
  Object.values(sounds).forEach(s => {
    try { s.volume = globalVolume; } catch(e) {}
  });
};

export const getVolume = () => globalVolume;

export const playSound = (name) => {
  try {
    if (sounds[name]) {
      sounds[name].volume = globalVolume;
      sounds[name].currentTime = 0;
      sounds[name].play().catch(() => {});
    }
  } catch(e) {}
};

export const stopAllSounds = () => {
  Object.values(sounds).forEach(s => {
    try { s.pause(); s.currentTime = 0; } catch(e) {}
  });
};
