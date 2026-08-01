"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand, Play } from "lucide-react";
import { PropertyMedia } from "@/components/media/property-media";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function PropertyPhoto({ image, name, type, className }: {
  image?: { url: string; alt: string };
  name: string;
  type: string;
  className?: string;
}) {
  if (!image) return <PropertyMedia seed={name} type={type} label={name} className={className} />;
  return <Image src={image.url} alt={image.alt} fill unoptimized className={cn("object-cover", className)} />;
}

export function PropertyGallery({
  images,
  type,
  name,
}: {
  images: { url: string; alt: string }[];
  type: string;
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const shown = images.slice(0, 5);

  return (
    <>
      <div className="site-container">
        <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:h-[520px] sm:grid-cols-4 sm:grid-rows-2">
          <button
            type="button"
            onClick={() => {
              setActive(0);
              setOpen(true);
            }}
            className="relative col-span-1 row-span-2 h-64 sm:col-span-2 sm:h-full"
          >
            <PropertyPhoto image={shown[0]} name={name} type={type} className="transition-transform duration-500 hover:scale-[1.03]" />
          </button>
          {shown.slice(1, 5).map((img, i) => (
            <button
              type="button"
              key={img.url}
              onClick={() => {
                setActive(i + 1);
                setOpen(true);
              }}
              className="relative hidden h-full sm:block"
            >
              <PropertyPhoto image={img} name={name} type={type} className="transition-transform duration-500 hover:scale-[1.03]" />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  +{images.length - 5} more
                </div>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-muted"
        >
          <Expand className="h-3.5 w-3.5" /> View all photos
        </button>
        <button
          type="button"
          className="mt-3 ml-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-muted"
        >
          <Play className="h-3.5 w-3.5" /> Watch video tour
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{name} photos</DialogTitle>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
            <PropertyPhoto image={images[active]} name={name} type={type} />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setActive(i)}
                  className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition",
                  active === i && "ring-gold"
                )}
              >
                  <PropertyPhoto image={img} name={name} type={type} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
