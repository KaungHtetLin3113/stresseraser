"use client";

import { ImagePlus, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

type ImageUploaderProps = {
  fileName: string | null;
  imageUrl: string | null;
  error: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onPreviewError: () => void;
};

export default function ImageUploader({
  fileName,
  imageUrl,
  error,
  onSelect,
  onRemove,
  onPreviewError,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = (file?: File) => {
    if (file) onSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className={`photo-control${isDragging ? " is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setIsDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        selectFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose a JPEG, PNG, or WebP photo"
        onChange={(event) => selectFile(event.currentTarget.files?.[0])}
      />
      {imageUrl ? (
        <div className="photo-control-preview">
          <Image
            src={imageUrl}
            alt={`Preview of ${fileName ?? "your photo"}`}
            width={40}
            height={40}
            unoptimized
            onError={onPreviewError}
          />
          <button
            type="button"
            className="photo-control-action"
            aria-label="Replace photo"
            title={fileName ? `Replace ${fileName}` : "Replace photo"}
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="photo-control-action photo-remove"
            aria-label="Remove photo"
            title="Remove photo"
            onClick={onRemove}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="photo-control-trigger"
          onClick={() => inputRef.current?.click()}
          aria-label="Add a face photo"
          title="Add a face photo"
        >
          <ImagePlus size={19} aria-hidden="true" />
        </button>
      )}
      {error && (
        <span className="photo-error" role="alert" title={error}>
          Photo error
        </span>
      )}
    </div>
  );
}
