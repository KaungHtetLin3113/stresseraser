"use client";

import {
  Droplet,
  Footprints,
  Hand,
  HandFist,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

type ActionControlsProps = {
  busy: boolean;
  action: "idle" | "hit" | "kick" | "punch" | "spit";
  canHit: boolean;
  canKick: boolean;
  onHit: () => void;
  onKick: () => void;
  onPunch: () => void;
  onSpit: () => void;
  onReset: () => void;
};

export default function ActionControls({
  busy,
  action,
  canHit,
  canKick,
  onHit,
  onKick,
  onPunch,
  onSpit,
  onReset,
}: ActionControlsProps) {
  return (
    <div className="action-dock">
      <div className="action-buttons">
        <button
          type="button"
          className="action-button hit-button"
          onClick={onHit}
          disabled={busy || !canHit}
          title={!canHit ? "A model with a HitReaction animation is required" : "Hit"}
          aria-label="Hit character"
        >
          {action === "hit" ? (
            <LoaderCircle className="button-icon is-spinning" size={18} aria-hidden="true" />
          ) : (
            <Hand className="button-icon" size={18} aria-hidden="true" />
          )}
          <span>Hit</span>
        </button>
        <button
          type="button"
          className="action-button kick-button"
          onClick={onKick}
          disabled={busy || !canKick}
          title={!canKick ? "A model with a Kick animation is required" : "Kick"}
          aria-label="Kick character"
        >
          {action === "kick" ? (
            <LoaderCircle className="button-icon is-spinning" size={18} aria-hidden="true" />
          ) : (
            <Footprints className="button-icon" size={18} aria-hidden="true" />
          )}
          <span>Kick</span>
        </button>
        <button
          type="button"
          className="action-button punch-button"
          onClick={onPunch}
          disabled={busy}
          aria-label="Punch character"
        >
          {action === "punch" ? (
            <LoaderCircle className="button-icon is-spinning" size={18} aria-hidden="true" />
          ) : (
            <HandFist className="button-icon" size={18} aria-hidden="true" />
          )}
          <span>Punch</span>
        </button>
        <button
          type="button"
          className="action-button spit-button"
          onClick={onSpit}
          disabled={busy}
          aria-label="Spit at character"
        >
          {action === "spit" ? (
            <LoaderCircle className="button-icon is-spinning" size={18} aria-hidden="true" />
          ) : (
            <Droplet className="button-icon" size={18} aria-hidden="true" />
          )}
          <span>Spit</span>
        </button>
        <button
          type="button"
          className="reset-button"
          onClick={onReset}
          aria-label="Reset camera view"
          title="Reset camera view"
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
