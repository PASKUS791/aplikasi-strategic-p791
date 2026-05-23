/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { useEffect } from "react";

const FAVICON_FRAMES = [
  "/favicon1.svg",
  "/favicon2.svg",
  "/favicon3.svg",
  "/favicon4.svg",
  "/favicon5.svg",
  "/favicon6.svg",
  "/favicon7.svg",
  "/favicon8.svg",
];

function getFaviconLink() {
  let link = document.querySelector("link[rel='icon']");

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "icon");
    link.setAttribute("type", "image/svg+xml");
    document.head.appendChild(link);
  }

  return link;
}

export function useAnimatedFavicon(delay = 400) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const faviconLink = getFaviconLink();
    const currentFrameIndex = FAVICON_FRAMES.indexOf(
      faviconLink.getAttribute("href") || "",
    );
    let frameIndex = currentFrameIndex >= 0 ? currentFrameIndex : 0;

    const applyFrame = () => {
      faviconLink.setAttribute("href", FAVICON_FRAMES[frameIndex]);
      frameIndex = (frameIndex + 1) % FAVICON_FRAMES.length;
    };

    applyFrame();
    const intervalId = window.setInterval(applyFrame, delay);

    return () => window.clearInterval(intervalId);
  }, [delay]);
}

