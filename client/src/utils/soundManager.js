const sounds = {};
const soundFiles = ['siang','senja','malam','wolf','eliminated','vote','win','lose','countdown','join','transition'];
soundFiles.forEach(name => {
  sounds[name] = new Audio(`/sounds/${name}.mp3`);
  sounds[name].volume = 0.4;
  sounds[name].onerror = () => {};
});

export const playSound = (name) => {
  try {
    if (sounds[name]) {
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
