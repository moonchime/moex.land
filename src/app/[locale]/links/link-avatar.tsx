"use client";

import { useEffect, useRef, useState } from "react";

type LinkAvatarProps = {
  name: string;
  src?: string;
  muted?: boolean;
};

/** Render a friend's remote avatar dynamically and fall back to a sharp-corner monogram if missing or broken. */
export function LinkAvatar({ name, src, muted = false }: LinkAvatarProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src]);

  const initial = Array.from(name.trim())[0] ?? "?";

  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center border border-gray-200 bg-[#f8fafc] text-sm font-medium text-gray-500${muted ? " opacity-60" : ""}`}
    >
      {src && !failed ? (
        // Dynamic remote friend avatars intentionally bypass next/image's static domain allowlist.
        // oxlint-disable-next-line nextjs/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </div>
  );
}
