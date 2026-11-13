"use client";

import React, { useEffect, useState } from "react";
import { ZoomIn, X, Monitor } from "lucide-react";

export interface FigureCallout {
  number: number;
  label: string;
  /** Bounding box as percentages relative to the 1440x900 screenshot */
  box: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
  /** Where to place the numbered circle badge relative to the highlight box */
  badgePosition?: "top-left" | "top-right" | "bottom-left";
}

interface AnnotatedFigureProps {
  src: string;
  alt: string;
  figureNumber: string;
  caption: string;
  screenLabel?: string;
  callouts?: FigureCallout[];
}

export function AnnotatedFigure({
  src,
  alt,
  figureNumber,
  caption,
  screenLabel,
  callouts = [],
}: AnnotatedFigureProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isZoomed]);

  const renderCalloutOverlays = () =>
    callouts.map((c) => {
      const badgePosClass =
        c.badgePosition === "top-right"
          ? "-top-3 -right-3"
          : c.badgePosition === "bottom-left"
          ? "-bottom-3 -left-3"
          : "-top-3 -left-3";

      return (
        <div
          key={c.number}
          style={{
            left: c.box.left,
            top: c.box.top,
            width: c.box.width,
            height: c.box.height,
          }}
          className="absolute pointer-events-none rounded-xl border-[2.5px] border-rose-500 bg-rose-500/[0.06] shadow-[0_0_0_2px_rgba(255,255,255,0.85),0_8px_20px_rgba(244,63,94,0.28)]"
        >
          <span
            className={`absolute ${badgePosClass} inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600 text-white text-xs sm:text-[13px] font-black shadow-md ring-2 ring-white`}
          >
            {c.number}
          </span>
        </div>
      );
    });

  return (
    <>
      <figure className="my-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {/* Browser window chrome bar */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            {screenLabel && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 truncate ml-1">
                <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{screenLabel}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom</span>
          </button>
        </div>

        {/* Annotated screenshot frame */}
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          aria-label={`Enlarge ${alt}`}
          className="group relative block w-full text-left bg-slate-100 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="w-full h-auto block select-none"
          />
          {renderCalloutOverlays()}

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm shadow">
              <ZoomIn className="w-3 h-3" />
              Click to inspect
            </span>
          </div>
        </button>

        {/* Legend + Caption */}
        <figcaption className="px-4 py-3 bg-slate-50/70 border-t border-slate-200/70 space-y-2">
          {callouts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {callouts.map((c) => (
                <span
                  key={c.number}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full pl-1 pr-2.5 py-0.5"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {c.number}
                  </span>
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="font-bold text-slate-700">{figureNumber}:</strong>{" "}
            {caption}
          </p>
        </figcaption>
      </figure>

      {/* Lightbox modal for enlarged screenshot inspection */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-700/40"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900 text-white">
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {figureNumber}
                </p>
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {caption}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                aria-label="Close enlarged screenshot"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative w-full bg-slate-100">
              <img src={src} alt={alt} className="w-full h-auto block" />
              {renderCalloutOverlays()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

