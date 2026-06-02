'use client';

import { useState, useRef } from "react";
import { PaperClipIcon, ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { uploadToS3 } from "@/lib/uploadToS3";
import { addTaskAttachment } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;

export default function TaskAttachments({ taskId, existingAttachments = [] }) {
  const [attachments, setAttachments] = useState(existingAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError("");
    setSuccess(false);

    if (file.size > MAX_BYTES) {
      setError("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    try {
      const fileUrl = await uploadToS3(file, "attachments");
      const res = await addTaskAttachment({ taskId, fileUrl, fileName: file.name });
      setAttachments((prev) => [...prev, res.data.attachment]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-2 bg-slate-800 rounded px-2.5 py-1.5"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PaperClipIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-300 text-xs truncate">{att.fileName}</span>
              </div>
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Download"
                className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">File attached!</p>}

      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white disabled:opacity-50 text-xs transition-colors"
      >
        {uploading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <PlusIcon className="w-3.5 h-3.5" />
            Attach file
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
