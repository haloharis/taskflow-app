'use client';

import { useState, useRef } from "react";
import { CameraIcon } from "@heroicons/react/24/solid";
import { uploadToS3 } from "@/lib/uploadToS3";
import { updateAvatar } from "@/lib/api";

const MAX_BYTES = 2 * 1024 * 1024;

export default function AvatarUpload({ currentAvatar, userName, onUploadSuccess, size = 40 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);
  const inputRef = useRef(null);

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError("");
    setToast(false);

    if (file.size > MAX_BYTES) {
      setError("File too large (max 2MB)");
      return;
    }

    setUploading(true);
    try {
      const fileUrl = await uploadToS3(file, "avatars");
      await updateAvatar({ avatarUrl: fileUrl });
      onUploadSuccess(fileUrl);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const iconSize = Math.max(12, Math.round(size * 0.38));
  const fontSize = Math.max(10, Math.round(size * 0.34));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="group w-full h-full rounded-full overflow-hidden relative focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        aria-label="Change avatar"
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center bg-purple-600 text-white font-semibold select-none"
          style={{ fontSize }}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={userName ?? "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(userName)
          )}
        </div>

        <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div
              className="border-2 border-white border-t-transparent rounded-full animate-spin"
              style={{ width: iconSize, height: iconSize }}
            />
          ) : (
            <CameraIcon
              style={{ width: iconSize, height: iconSize }}
              className="text-white"
            />
          )}
        </div>
      </button>

      {(toast || error) && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded text-xs whitespace-nowrap z-50 pointer-events-none ${
            error ? "bg-red-900/90 text-red-300" : "bg-green-700 text-white"
          }`}
        >
          {error || "Avatar updated!"}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
