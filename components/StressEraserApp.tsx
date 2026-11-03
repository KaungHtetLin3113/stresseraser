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
const SOUND_FILES = {
  hit: "/audio/hit-sound.mp3",
  kick: "/audio/kick-sound.mp3",
  punch: "/audio/punch-sound.mp3",
  spit: "/audio/spit-sound.mp3",
  backgroundMusic: "/audio/background-music.mp3",
  kneelingMusic: "/audio/kneeling-bg-music.mp3",
  fire: "/audio/fire-sound.mp3",
} as const;
type SoundKind = keyof typeof SOUND_FILES;
type SoundAssetStatus = Record<`${SoundKind}Sound`, boolean>;
type EffectSound = Exclude<SoundKind, "backgroundMusic" | "kneelingMusic">;
type Photo = { name: string; url: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STRIKES_TO_RESTRAIN = 10;
const RESTRAINT_DELAY_MS = 5_000;
const KNEELING_DURATION_MS = 5_000;

export default function StressEraserApp() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [action, setAction] = useState<Action>("idle");
  const [punchSequence, setPunchSequence] = useState(0);
  const [strikeCount, setStrikeCount] = useState(0);
  const [isRestrained, setIsRestrained] = useState(false);
  const [isKneeling, setIsKneeling] = useState(false);
  const [restraintDeadline, setRestraintDeadline] = useState<number | null>(null);
  const [restraintCountdown, setRestraintCountdown] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [soundStatus, setSoundStatus] = useState<Record<SoundKind, SoundStatus>>({
    hit: "checking",
    kick: "checking",
    punch: "checking",
    spit: "checking",
    backgroundMusic: "checking",
    kneelingMusic: "checking",
    fire: "checking",
  });
  const [soundError, setSoundError] = useState<string | null>(null);
  const [cameraReset, setCameraReset] = useState(0);
  const audioRef = useRef<Record<SoundKind, HTMLAudioElement | null>>({
    hit: null,
    kick: null,
    punch: null,
    spit: null,
    backgroundMusic: null,
    kneelingMusic: null,
    fire: null,
  });
  const mutedRef = useRef(false);
  const nameDialogRef = useRef<HTMLDialogElement>(null);
  const actionLock = useRef(false);
  const pendingStrike = useRef(false);
  const strikeCountRef = useRef(0);
  const restraintDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (restraintDeadline === null) return;

    const updateCountdown = () => {
      const remainingMs = restraintDeadline - Date.now();
      if (remainingMs <= 0) {
        pendingStrike.current = false;
        if (isRestrained) {
          const kneelingDeadline = Date.now() + KNEELING_DURATION_MS;
          restraintDeadlineRef.current = kneelingDeadline;
          setRestraintDeadline(kneelingDeadline);
          setRestraintCountdown(KNEELING_DURATION_MS / 1000);
          setIsRestrained(false);
          setIsKneeling(true);
        } else if (isKneeling) {
          restraintDeadlineRef.current = null;
          setRestraintDeadline(null);
          setRestraintCountdown(null);
          setIsKneeling(false);
          strikeCountRef.current = 0;
          setStrikeCount(0);
        }
        return;
      }

      setRestraintCountdown(Math.ceil(remainingMs / 1000));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 100);
    return () => window.clearInterval(timer);
  }, [isKneeling, isRestrained, restraintDeadline]);

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

    for (const kind of Object.keys(SOUND_FILES) as SoundKind[]) {
      const audio = new Audio(SOUND_FILES[kind]);
      audio.preload = "auto";
      if (kind === "backgroundMusic" || kind === "kneelingMusic" || kind === "fire") {
        audio.loop = true;
        audio.volume =
          kind === "backgroundMusic" ? 0.2 : kind === "fire" ? 0.45 : 0.3;
      }
      audio.addEventListener(
        "error",
        () => setSoundStatus((current) => ({ ...current, [kind]: "error" })),
        { once: true },
      );
      audioElements.push(audio);
      audioRef.current[kind] = audio;
    }

    const prepareSounds = async () => {
      try {
        const response = await fetch("/api/assets/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Sound asset check failed (${response.status}).`);
        }

        const assets: SoundAssetStatus = await response.json();
        if (controller.signal.aborted) return;

        for (const kind of Object.keys(SOUND_FILES) as SoundKind[]) {
          const exists = assets[`${kind}Sound`];
          if (!exists) {
            setSoundStatus((current) => ({ ...current, [kind]: "missing" }));
            continue;
          }

          setSoundStatus((current) =>
            current[kind] === "error"
              ? current
              : { ...current, [kind]: "ready" },
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not check the sound assets.", error);
        setSoundStatus({
          hit: "error",
          kick: "error",
          punch: "error",
          spit: "error",
          backgroundMusic: "error",
          kneelingMusic: "error",
          fire: "error",
        });
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
      audioRef.current = {
        hit: null,
        kick: null,
        punch: null,
        spit: null,
        backgroundMusic: null,
        kneelingMusic: null,
        fire: null,
      };
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

  const playSound = useCallback((kind: EffectSound) => {
    if (mutedRef.current) return;
    const audio = audioRef.current[kind];
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch((error: unknown) => {
      console.warn(`The ${kind} sound could not be played.`, error);
      setSoundError("Sound playback was blocked by your browser. The action still works.");
    });
  }, []);

  const playMusic = useCallback(() => {
    if (mutedRef.current) return;

    const activeMusic = isKneeling ? "kneelingMusic" : "backgroundMusic";
    const inactiveMusic = isKneeling ? "backgroundMusic" : "kneelingMusic";
    const audio = audioRef.current[activeMusic];
    if (!audio) return;

    audioRef.current[inactiveMusic]?.pause();
    if (!audio.paused) return;

    void audio.play().catch((error: unknown) => {
      console.warn("The background music could not be played.", error);
      setSoundError("Audio playback was blocked by your browser.");
    });
  }, [isKneeling]);

  const toggleMuted = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setMuted(nextMuted);

    if (nextMuted) {
      for (const audio of Object.values(audioRef.current)) {
        audio?.pause();
      }
      return;
    }
    playMusic();
    if (isRestrained) playSound("fire");
  }, [isRestrained, playMusic, playSound]);

  useEffect(() => {
    playMusic();
  }, [isKneeling, playMusic]);

  useEffect(() => {
    const fireSound = audioRef.current.fire;
    if (!fireSound) return;

    if (isRestrained) {
      playSound("fire");
    } else {
      fireSound.pause();
      fireSound.currentTime = 0;
    }

    return () => fireSound.pause();
  }, [isRestrained, playSound]);

  useEffect(() => {
    if (!isRestrained) return;

    const launchPunch = () => {
      if (
        actionLock.current ||
        restraintDeadlineRef.current === null ||
        Date.now() >= restraintDeadlineRef.current
      ) {
        return;
      }

      actionLock.current = true;
      pendingStrike.current = true;
      setPunchSequence((sequence) => sequence + 1);
      setAction("punch");
      playSound("punch");
    };

    launchPunch();
    const interval = window.setInterval(launchPunch, 250);
    return () => window.clearInterval(interval);
  }, [isRestrained, playSound]);

  const runAction = useCallback(
    (nextAction: Exclude<Action, "idle">) => {
      if (actionLock.current || action !== "idle") return;
      actionLock.current = true;
      pendingStrike.current =
        nextAction === "hit" || nextAction === "kick" || nextAction === "punch";
      setAction(nextAction);
      setSoundError(null);
      playMusic();
      if (nextAction === "hit" || nextAction === "kick" ||
          nextAction === "punch" || nextAction === "spit") {
        playSound(nextAction);
      }
    },
    [action, playMusic, playSound],
  );

  const finishAction = useCallback(() => {
    if (pendingStrike.current) {
      pendingStrike.current = false;
      const nextStrikeCount = strikeCountRef.current + 1;
      strikeCountRef.current = nextStrikeCount;
      setStrikeCount(nextStrikeCount);
      if (nextStrikeCount === STRIKES_TO_RESTRAIN) {
        const deadline = Date.now() + RESTRAINT_DELAY_MS;
        restraintDeadlineRef.current = deadline;
        setRestraintDeadline(deadline);
        setIsRestrained(true);
      }
    }
    actionLock.current = false;
    setAction("idle");
  }, []);
  const handlePhotoTextureError = useCallback(() => {
    setPhotoError(
      "The photo could not be applied to the character. Try another JPEG, PNG, or WebP image.",
    );
  }, []);

  const hasSoundWarning = Object.values(soundStatus).some(
    (status) => status === "missing" || status === "error",
  );

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
            onClick={toggleMuted}
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
          <div className={`scene-wrap${isRestrained ? " is-fire-background" : ""}`}>
            {isRestrained && <div className="fire-background" aria-hidden="true" />}
            <StressScene
              action={action}
              cameraReset={cameraReset}
              faceImageUrl={photo?.url ?? null}
              isRestrained={isRestrained}
              isKneeling={isKneeling}
              punchSequence={punchSequence}
              onActionComplete={finishAction}
              onPhotoTextureError={handlePhotoTextureError}
            />
            <div className="scene-glow" aria-hidden="true" />
            <div className="scene-floor-glow" aria-hidden="true" />
            <div className="strike-counter" aria-live="polite" aria-atomic="true">
              {isRestrained
                ? `Punch barrage: ${restraintCountdown ?? 5}s left! (${strikeCount} punches)`
                : isKneeling
                  ? `Kneeling: ${restraintCountdown ?? 5}s`
                : `Strikes ${strikeCount} / ${STRIKES_TO_RESTRAIN}`}
            </div>
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
