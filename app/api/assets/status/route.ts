import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

async function assetExists(assetPath: string) {
  try {
    await access(assetPath, constants.R_OK);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

export async function GET() {
  const publicDirectory = path.join(process.cwd(), "public");
  const [
    hitSound,
    kickSound,
    punchSound,
    spitSound,
    backgroundMusicSound,
    kneelingMusicSound,
    fireSound,
  ] = await Promise.all([
    assetExists(path.join(publicDirectory, "audio", "hit-sound.mp3")),
    assetExists(path.join(publicDirectory, "audio", "kick-sound.mp3")),
    assetExists(path.join(publicDirectory, "audio", "punch-sound.mp3")),
    assetExists(path.join(publicDirectory, "audio", "spit-sound.mp3")),
    assetExists(path.join(publicDirectory, "audio", "background-music.mp3")),
    assetExists(path.join(publicDirectory, "audio", "kneeling-bg-music.mp3")),
    assetExists(path.join(publicDirectory, "audio", "fire-sound.mp3")),
  ]);

  return NextResponse.json(
    {
      hitSound,
      kickSound,
      punchSound,
      spitSound,
      backgroundMusicSound,
      kneelingMusicSound,
      fireSound,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
