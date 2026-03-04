"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ThemeAwareLogoProps = {
  alt: string;
  width: number;
  height: number;
  className?: string;
  lightSrc?: string;
  darkSrc?: string;
};

const DEFAULT_LIGHT_SRC = "/register-logo.png";
const DEFAULT_DARK_SRC = "/register-logo-dark.png";

function isDarkModeActive() {
  if (typeof window === "undefined") {
    return false;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const hasDarkClass = document.documentElement.classList.contains("dark");
  return prefersDark || hasDarkClass;
}

export function ThemeAwareLogo({
  alt,
  width,
  height,
  className,
  lightSrc = DEFAULT_LIGHT_SRC,
  darkSrc = DEFAULT_DARK_SRC,
}: ThemeAwareLogoProps) {
  const [useDarkLogo, setUseDarkLogo] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setUseDarkLogo(isDarkModeActive());

    update();

    const onMediaChange = () => update();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onMediaChange);
    } else {
      mediaQuery.addListener(onMediaChange);
    }

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", onMediaChange);
      } else {
        mediaQuery.removeListener(onMediaChange);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <Image
      src={useDarkLogo ? darkSrc : lightSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
