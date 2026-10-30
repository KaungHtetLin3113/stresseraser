# StressEraser

StressEraser is a dark, playful Tamagotchi-style stress-relief game. Upload a
photo to apply a cropped portrait to the character's face; the photo remains on
your device. After uploading, enter a name in the header to display it beneath
the character.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `1` for Hit, `2` for
Kick, `3` for Punch, and `4` for Spit when focus is not in a form control. Drag
the scene to rotate the character; use the reset button to restore the camera.

## Cartoon character

The character is built from stylized Three.js shapes and does not require an
external model file. Hit plays a foam-mallet bonk with a squash, comic spark,
and springy recovery; Kick sends in a foot while the character recoils; Punch
sends in a cartoon boxing glove and makes the character flinch; Spit launches a
small cartoon droplet toward the character and triggers a funny disgusted
reaction. Uploaded JPEG, PNG, and WebP images are center-cropped to a square
face texture and displayed on the character; the face returns to its cartoon
features when the photo is removed.

## Sound assets

- `public/hit-sound.mp3` — hit sound effect.
- `public/kick-sound.mp3` — optional kick sound effect.

Uploaded photos remain in the browser and are never sent to a server. The
portrait is a stylized texture on the cartoon character, not 3D face
reconstruction.
