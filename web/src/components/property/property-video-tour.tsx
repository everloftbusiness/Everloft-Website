"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Video, Plane, Compass, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

export type PropertyVideo = {
  id: string;
  url: string;
  videoType: string;
  caption: string | null;
};

const VIDEO_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  walkthrough: { label: "Walkthrough Tour", icon: Video },
  drone: { label: "Drone Aerial View", icon: Plane },
  virtual_tour_360: { label: "360° Virtual Tour", icon: Compass },
};

export function PropertyVideoTour({
  videos,
  propertyName,
}: {
  videos: PropertyVideo[];
  propertyName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videos || videos.length === 0) return null;

  const currentVideo = videos[activeIdx] || videos[0];
  const meta = VIDEO_META[currentVideo.videoType] ?? { label: currentVideo.videoType, icon: Video };
  const Icon = meta.icon;

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }

  function handleFullscreen() {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }

  return (
    <section id="video-tour" className="section-padding bg-slate-950 text-white border-t border-white/10">
      <div className="site-container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-4 w-4" />
              Cinematic Experience
            </div>
            <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Video Walkthrough Tour
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Experience the spaces, views, and ambience of {propertyName} before you arrive.
            </p>
          </div>

          {/* Video Switcher Tabs (if multiple videos) */}
          {videos.length > 1 && (
            <div className="flex items-center gap-2 rounded-full bg-white/10 p-1 backdrop-blur-md">
              {videos.map((vid, idx) => {
                const tabMeta = VIDEO_META[vid.videoType] ?? { label: vid.videoType, icon: Video };
                const TabIcon = tabMeta.icon;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      setActiveIdx(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      activeIdx === idx ? "bg-emerald-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tabMeta.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Player Box */}
        <Reveal className="mt-8">
          <div className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
            <video
              ref={videoRef}
              key={currentVideo.url}
              src={currentVideo.url}
              playsInline
              muted={isMuted}
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoError(true)}
              className="h-full w-full object-cover"
              onClick={togglePlay}
            />

            {/* Error Message Fallback */}
            {videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                <Video className="h-10 w-10 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-white">Video is currently preparing or being processed</p>
                <p className="text-xs text-slate-400 mt-1">Please refresh in a moment to stream the tour.</p>
              </div>
            )}

            {/* Floating Top Badge */}
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md border border-white/10">
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              {currentVideo.caption && (
                <span className="hidden sm:inline-flex rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur-md border border-white/10">
                  {currentVideo.caption}
                </span>
              )}
            </div>

            {/* Center Big Play Button (when paused) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-emerald-500 active:scale-95"
              >
                <Play className="h-8 w-8 fill-white ml-1" />
              </button>
            )}

            {/* Bottom Control Bar */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-105"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-105"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-105"
                aria-label="Full screen"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
