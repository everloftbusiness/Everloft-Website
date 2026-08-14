"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Upload,
  Video,
  Play,
  Compass,
  Plane,
  Sparkles,
  CheckCircle2,
  CloudUpload,
  Zap,
  Film,
  Clock,
  HardDrive,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removePropertyVideoAction } from "@/features/properties/actions/onboarding.actions";
import { formatBytes } from "@/lib/utils/image-compressor";

type PropertyVideoItem = {
  id: string;
  videoType: string;
  caption: string | null;
  publicUrl: string | null;
};

const VIDEO_TYPE_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  walkthrough: { label: "Walkthrough Tour", icon: Video },
  drone: { label: "Drone Aerial View", icon: Plane },
  virtual_tour_360: { label: "360° Virtual Tour", icon: Compass },
};

type VideoProgressState = {
  active: boolean;
  phase: "preparing" | "uploading" | "processing" | "complete";
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  speed: string;
  eta: string;
  fileName: string;
};

export function VideosManager({
  propertyId,
  videos,
}: {
  propertyId: string;
  videos: PropertyVideoItem[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoResolution, setVideoResolution] = useState<string | null>(null);

  const [videoType, setVideoType] = useState<string>("walkthrough");
  const [caption, setCaption] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState<VideoProgressState>({
    active: false,
    phase: "preparing",
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
    speed: "",
    eta: "",
    fileName: "",
  });

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  function handleSelectFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (file.size > 500 * 1024 * 1024) {
      setError("Video exceeds the 500MB size limit. Please choose a video under 500MB.");
      return;
    }

    setError("");
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read video metadata (duration & resolution)
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration);
      const width = tempVideo.videoWidth;
      const height = tempVideo.videoHeight;
      if (width >= 3840 || height >= 2160) {
        setVideoResolution("4K Ultra HD");
      } else if (width >= 1920 || height >= 1080) {
        setVideoResolution("1080p Full HD");
      } else if (width >= 1280 || height >= 720) {
        setVideoResolution("720p HD");
      } else {
        setVideoResolution(`${width}x${height}`);
      }
    };
  }

  function handleCancelSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(null);
    setVideoResolution(null);
    setCaption("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");

    setProgress({
      active: true,
      phase: "preparing",
      percent: 5,
      loadedBytes: 0,
      totalBytes: selectedFile.size,
      speed: "Initializing...",
      eta: "Estimating...",
      fileName: selectedFile.name,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/properties/${propertyId}/videos/upload`);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");
        xhr.setRequestHeader("x-file-name", encodeURIComponent(selectedFile.name));
        xhr.setRequestHeader("x-file-type", selectedFile.type || "video/mp4");
        xhr.setRequestHeader("x-video-type", videoType);
        if (caption.trim()) {
          xhr.setRequestHeader("x-caption", encodeURIComponent(caption.trim()));
        }

        let startTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const currentTime = Date.now();
            const timeDiff = (currentTime - startTime) / 1000;

            const percent = Math.min(95, Math.round((e.loaded / e.total) * 100));

            let speedText = "";
            let etaText = "";

            if (timeDiff > 0.3) {
              const bytesPerSecond = e.loaded / timeDiff;
              speedText = `${formatBytes(bytesPerSecond)}/s`;

              const remainingBytes = e.total - e.loaded;
              const remainingSeconds = Math.ceil(remainingBytes / (bytesPerSecond || 1));
              etaText = remainingSeconds < 60 ? `~${remainingSeconds}s remaining` : `~${Math.ceil(remainingSeconds / 60)}m remaining`;
            }

            setProgress({
              active: true,
              phase: "uploading",
              percent,
              loadedBytes: e.loaded,
              totalBytes: e.total,
              speed: speedText || "Uploading...",
              eta: etaText || "Processing...",
              fileName: selectedFile.name,
            });

            lastLoaded = e.loaded;
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress((prev) => ({
              ...prev,
              phase: "processing",
              percent: 98,
              speed: "Finalizing cloud stream...",
              eta: "Just a moment...",
            }));
            resolve();
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network connection error during video upload. Please try again."));
        };

        xhr.ontimeout = () => {
          reject(new Error("Video upload timed out. Please check your network and try again."));
        };

        xhr.send(selectedFile);
      });

      // Complete
      setProgress((prev) => ({
        ...prev,
        phase: "complete",
        percent: 100,
        speed: "Done!",
        eta: "Completed",
      }));

      await new Promise((r) => setTimeout(r, 900));

      handleCancelSelection();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed. Try again.");
    } finally {
      setIsUploading(false);
      setProgress((prev) => ({ ...prev, active: false }));
    }
  }

  async function handleRemove(videoId: string) {
    if (!confirm("Are you sure you want to remove this video tour?")) return;
    try {
      await removePropertyVideoAction(propertyId, videoId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video.");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-semibold flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="p-1 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Drop Zone */}
      {!selectedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/50 p-8 text-center transition-all hover:border-emerald-500/50 group"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
            <Video className="h-7 w-7" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">Click or tap to upload property video tour</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            Record with your phone camera, upload walkthrough tours, drone views, or 360° footage (MP4, WebM, MOV up to 500MB).
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Cloudflare R2 High-Speed Streaming Enabled
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*,video/mp4,video/webm,video/quicktime,video/mov"
            className="hidden"
            onChange={(e) => handleSelectFile(e.target.files)}
          />
        </div>
      ) : (
        /* Staged Video Upload Form */
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 sm:p-6 text-foreground shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                <Film className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">Staged Video Ready to Upload</p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {selectedFile.name} • {formatBytes(selectedFile.size)}
                  {videoResolution && ` • ${videoResolution}`}
                  {videoDuration && ` • ${formatDuration(videoDuration)}`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelSelection}
              disabled={isUploading}
              className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 h-7 text-xs"
            >
              Cancel
            </Button>
          </div>

          {/* Real-time Video Upload Progress Box */}
          {progress.active && (
            <div className="rounded-xl border border-emerald-500/40 bg-white/95 dark:bg-slate-900/95 p-3.5 space-y-3 shadow-md animate-in fade-in-50 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {progress.phase === "preparing" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-amber-950 shadow-sm animate-pulse">
                      <Zap className="h-4 w-4 fill-current" />
                    </div>
                  ) : progress.phase === "uploading" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm animate-bounce">
                      <CloudUpload className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      {progress.phase === "preparing" && <span>⚡ Step 1: Preparing Video Stream...</span>}
                      {progress.phase === "uploading" && (
                        <span>☁️ Step 2: Uploading Video ({progress.percent}%)...</span>
                      )}
                      {progress.phase === "processing" && (
                        <span>✨ Step 3: Finalizing Cloud Distribution...</span>
                      )}
                      {progress.phase === "complete" && <span>🎉 Video Uploaded & Published!</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md font-medium">
                      {progress.fileName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-emerald-900 dark:text-emerald-300">
                    {progress.percent}%
                  </span>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {progress.speed || "High-Speed Upload"}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-900/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Real-time Transfer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 border border-border">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Data Transferred:
                  </span>
                  <span className="font-bold text-foreground">
                    {formatBytes(progress.loadedBytes)} / {formatBytes(progress.totalBytes)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 border border-border">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Speed & ETA:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {progress.speed} {progress.eta ? `(${progress.eta})` : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Video Preview Player */}
          {previewUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border shadow-md">
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Tour Category</Label>
              <Select value={videoType} onValueChange={setVideoType} disabled={isUploading}>
                <SelectTrigger className="w-full bg-background border-input text-foreground text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="walkthrough" className="text-xs">Walkthrough Tour</SelectItem>
                  <SelectItem value="drone" className="text-xs">Drone Aerial View</SelectItem>
                  <SelectItem value="virtual_tour_360" className="text-xs">360° Virtual Tour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">Video Caption (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. Sunset pool view & master bedroom tour"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isUploading}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground text-xs h-9"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-500/20">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelSelection}
              disabled={isUploading}
              className="border-border bg-background text-foreground hover:bg-muted text-xs h-8"
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Uploading ({progress.percent}%)...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload Video Tour
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Uploaded Videos */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Uploaded Videos ({videos.length})
        </h4>

        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
            No video tours uploaded yet. Upload a walkthrough video to showcase this property.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((vid) => {
              const meta = VIDEO_TYPE_LABELS[vid.videoType] ?? { label: vid.videoType, icon: Video };
              const Icon = meta.icon;
              return (
                <div
                  key={vid.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                    {vid.publicUrl ? (
                      <video
                        src={vid.publicUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Play className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-2 px-1">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      {vid.caption && (
                        <p className="text-xs font-medium text-foreground line-clamp-1">
                          {vid.caption}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(vid.id)}
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
