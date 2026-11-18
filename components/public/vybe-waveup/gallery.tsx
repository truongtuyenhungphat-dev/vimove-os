"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "cn";

export function VybeWaveupGallery({ images, productName }: { images: { src: string; alt: string }[]; productName: string }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function restartAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4000);
  }

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  function select(i: number) {
    setIndex(i);
    restartAutoplay();
  }

  const active = images[index];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        {active && <Image src={active.src} alt={active.alt || productName} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" priority />}
        <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow">
          Bảo hành phụ kiện trọn đời
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => select(i)}
            aria-label={img.alt || `Ảnh ${i + 1}`}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border bg-muted transition",
              i === index ? "border-primary ring-1 ring-primary" : "hover:border-primary/40"
            )}
          >
            <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
