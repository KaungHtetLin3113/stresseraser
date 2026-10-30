"use client";

import dynamic from "next/dynamic";
import {
  LoaderCircle,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ActionControls from "./ActionControls";
import ImageUploader from "./ImageUploader";
import type {
  CharacterAction,
} from "./StressScene";

const StressScene = dynamic(() => import("./StressScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <LoaderCircle className="is-spinning" size={24} aria-hidden="true" />
      <span>Loading…</span>
    </div>
  ),
});

type Action = CharacterAction;
type SoundStatus = "checking" | "ready" | "missing" | "error";
type Photo = { name: string; url: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
export default function StressEraserApp() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [action, setAction] = useState<Action>("idle");
  const [muted, setMuted] = useState(false);
  const [soundStatus, setSoundStatus] = useState<{
    hit: SoundStatus;
    kick: SoundStatus;
  }>({ hit: "checking", kick: "checking" });
  const [soundError, setSoundError] = useState<string | null>(null);
  const [cameraReset, setCameraReset] = useState(0);
  const audioRef = useRef<{
    hit: HTMLAudioElement | null;
    kick: HTMLAudioElement | null;
  }>({ hit: null, kick: null });
  const nameDialogRef = useRef<HTMLDialogElement>(null);
  const actionLock = useRef(false);

  useEffect(() => {
    const dialog = nameDialogRef.current;
    if (!dialog) return;

    if (isNameDialogOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isNameDialogOpen && dialog.open) {
      dialog.close();
    }
  }, [isNameDialogOpen]);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  useEffect(() => {
    const controller = new AbortController();
    const audioElements: HTMLAudioElement[] = [];

    const prepareSounds = async () => {
      try {
        const response = await fetch("/api/assets/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Sound asset check failed (${response.status}).`);
        }

        const assets: { hitSound: boolean; kickSound: boolean } =
          await response.json();
        if (controller.signal.aborted) return;

        for (const kind of ["hit", "kick"] as const) {
          const exists = kind === "hit" ? assets.hitSound : assets.kickSound;
          if (!exists) {
            setSoundStatus((current) => ({ ...current, [kind]: "missing" }));
            continue;
          }

          const audio = new Audio(
            kind === "hit" ? "/hit-sound.mp3" : "/kick-sound.mp3",
          );
          audio.preload = "auto";
          audio.addEventListener(
            "error",
            () => setSoundStatus((current) => ({ ...current, [kind]: "error" })),
            { once: true },
          );
          audioElements.push(audio);
          audioRef.current[kind] = audio;
          setSoundStatus((current) => ({ ...current, [kind]: "ready" }));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not check the sound assets.", error);
        setSoundStatus({ hit: "error", kick: "error" });
      }
    };

    void prepareSounds();

    return () => {
      controller.abort();
      audioElements.forEach((audio) => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      });
      audioRef.current = { hit: null, kick: null };
    };
  }, []);

  const selectPhoto = useCallback((file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("That image is larger than 10 MB. Choose a smaller file.");
      return;
    }
    if (file.size === 0) {
      setPhotoError("This image file is empty. Choose another photo.");
      return;
    }

    setPhotoError(null);
    setPhoto({ name: file.name, url: URL.createObjectURL(file) });
    setIsNameDialogOpen(true);
  }, []);

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setPhotoError(null);
    setCharacterName("");
    setIsNameDialogOpen(false);
  }, []);
  const handlePhotoPreviewError = useCallback(() => {
    setPhoto(null);
    setPhotoError("This image could not be decoded. Choose a valid JPEG, PNG, or WebP photo.");
    setCharacterName("");
    setIsNameDialogOpen(false);
  }, []);

  const playSound = useCallback((kind: "hit" | "kick") => {
    if (muted) return;
    const audio = audioRef.current[kind];
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch((error: unknown) => {
      console.warn(`The ${kind} sound could not be played.`, error);
      setSoundError("Sound playback was blocked by your browser. The action still works.");
    });
  }, [muted]);

  const runAction = useCallback(
    (nextAction: Exclude<Action, "idle">) => {
      if (actionLock.current || action !== "idle") return;
      actionLock.current = true;
      setAction(nextAction);
      setSoundError(null);
      if (nextAction === "hit" || nextAction === "kick") {
        playSound(nextAction);
      }
    },
    [action, playSound],
  );

  const finishAction = useCallback(() => {
    actionLock.current = false;
    setAction("idle");
  }, []);
  const handlePhotoTextureError = useCallback(() => {
    setPhotoError(
      "The photo could not be applied to the character. Try another JPEG, PNG, or WebP image.",
    );
  }, []);

  const hasSoundWarning =
    soundStatus.hit === "missing" ||
    soundStatus.kick === "missing" ||
    soundStatus.hit === "error" ||
    soundStatus.kick === "error";

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target.tagName))
      ) {
        return;
      }

      if (event.key === "1") runAction("hit");
      if (event.key === "2") runAction("kick");
      if (event.key === "3") runAction("punch");
      if (event.key === "4") runAction("spit");
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [runAction]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="StressEraser">
          <span className="brand-mark" aria-hidden="true">
            <Sparkles size={20} />
          </span>
          <span className="brand-name">Stress<span>Eraser</span></span>
        </div>
        <div className="topbar-right">
          <ImageUploader
            fileName={photo?.name ?? null}
            imageUrl={photo?.url ?? null}
            error={photoError}
            onSelect={selectPhoto}
            onRemove={removePhoto}
            onPreviewError={handlePhotoPreviewError}
          />
          {photo && (
            <input
              className="character-name-input"
              type="text"
              value={characterName}
              onChange={(event) => setCharacterName(event.currentTarget.value)}
              maxLength={24}
              placeholder="Name your buddy"
              aria-label="Character name"
            />
          )}
          <button
            type="button"
            className="icon-button sound-toggle"
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
            title={muted ? "Turn sound on" : "Mute sound"}
          >
            {muted ? (
              <VolumeX size={18} aria-hidden="true" />
            ) : (
              <Volume2 size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <dialog
        ref={nameDialogRef}
        className="character-name-dialog"
        aria-labelledby="character-name-title"
        onCancel={(event) => {
          event.preventDefault();
          setIsNameDialogOpen(false);
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (characterName.trim()) setIsNameDialogOpen(false);
          }}
        >
          <h2 id="character-name-title">Name your buddy</h2>
          <p>Give your photo character a name to get started.</p>
          <input
            className="character-name-dialog-input"
            type="text"
            value={characterName}
            onChange={(event) => setCharacterName(event.currentTarget.value)}
            maxLength={24}
            placeholder="Enter a name"
            aria-label="Character name"
            autoFocus
          />
          <div className="character-name-dialog-actions">
            <button
              type="button"
              className="name-dialog-skip"
              onClick={() => setIsNameDialogOpen(false)}
            >
              Not now
            </button>
            <button
              type="submit"
              className="name-dialog-submit"
              disabled={!characterName.trim()}
            >
              Save name
            </button>
          </div>
        </form>
      </dialog>

      <section className="studio-layout" aria-label="Stress relief studio">
        <section className="character-panel" aria-label="Interactive character">
          <div className="scene-wrap">
            <StressScene
              action={action}
              cameraReset={cameraReset}
              faceImageUrl={photo?.url ?? null}
              onActionComplete={finishAction}
              onPhotoTextureError={handlePhotoTextureError}
            />
            <div className="scene-glow" aria-hidden="true" />
            <div className="scene-floor-glow" aria-hidden="true" />
            {characterName.trim() && (
              <div className="character-nameplate" aria-live="polite">
                {characterName.trim()}
              </div>
            )}
          </div>

          <ActionControls
            busy={action !== "idle"}
            action={action}
            canHit
            canKick
            onHit={() => runAction("hit")}
            onKick={() => runAction("kick")}
            onPunch={() => runAction("punch")}
            onSpit={() => runAction("spit")}
            onReset={() => setCameraReset((value) => value + 1)}
          />

          <div className="asset-notices" aria-live="polite">
            {hasSoundWarning && (
              <span className="asset-notice notice-warning" title="Sound effects unavailable">
                Sound off
              </span>
            )}
            {soundError && (
              <span className="asset-notice notice-warning" role="alert" title={soundError}>
                Sound blocked
              </span>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
