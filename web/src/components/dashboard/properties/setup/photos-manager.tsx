"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadPropertyPhotoAction,
  setCoverPhotoAction,
  removePropertyPhotoAction,
} from "@/features/properties/actions/onboarding.actions";

type Photo = { id: string; isCover: boolean; publicUrl: string | null };
type StagedFile = { key: string; file: File; previewUrl: string };

export function PhotosManager({ propertyId, photos }: { propertyId: string; photos: Photo[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Revoke local object URLs on unmount to avoid leaking memory.
  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    const next = Array.from(files).map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setStaged((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeStaged(key: string) {
    setStaged((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.key !== key);
    });
  }

  async function handleUploadAll() {
    setIsUploading(true);
    setError("");
    try {
      // Parallel upload — each is an independent Server Action call.
      await Promise.all(
        staged.map((s) => {
          const formData = new FormData();
          formData.set("file", s.file);
          return uploadPropertyPhotoAction(propertyId, formData);
        })
      );
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetCover(photoId: string) {
    await setCoverPhotoAction(propertyId, photoId);
    router.refresh();
  }

  async function handleRemove(photoId: string) {
    await removePropertyPhotoAction(propertyId, photoId);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        {photos.length} photo{photos.length === 1 ? "" : "s"} uploaded · {photos.some((p) => p.isCover) ? "Cover set" : "No cover selected"}
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/40">
        <Upload className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium text-primary">Drag files here or click to browse</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WebP — up to 25MB each, select multiple at once</span>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleSelectFiles(e.target.files)} />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {staged.length > 0 && (
        <div className="rounded-xl border border-dashed border-gold/50 bg-gold-soft p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">
              {staged.length} photo{staged.length === 1 ? "" : "s"} ready — not uploaded yet
            </p>
            <Button type="button" variant="gold" size="sm" onClick={handleUploadAll} disabled={isUploading}>
              {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Upload {staged.length} Photo{staged.length === 1 ? "" : "s"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {staged.map((s) => (
              <div key={s.key} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeStaged(s.key)}
                  disabled={isUploading}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-soft">
              {photo.publicUrl ? (
                <Image src={photo.publicUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No preview</div>
              )}
              {photo.isCover && (
                <span className="absolute left-1 top-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-gold-foreground">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.isCover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(photo.id)}
                    className="rounded p-1 text-white hover:bg-white/20"
                    title="Set as cover"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(photo.id)}
                  className="rounded p-1 text-white hover:bg-white/20"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
