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
  const [hitSound, kickSound] = await Promise.all([
    assetExists(path.join(publicDirectory, "hit-sound.mp3")),
    assetExists(path.join(publicDirectory, "kick-sound.mp3")),
  ]);

  return NextResponse.json(
    { hitSound, kickSound },
    { headers: { "Cache-Control": "no-store" } },
  );
}
