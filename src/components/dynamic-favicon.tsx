"use client";

import { useEffect } from "react";

const LIGHT_FAVICON = "/register-logo.png";
const DARK_FAVICON = "/register-logo-dark.png";

function resolveFaviconHref() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const hasDarkClass = document.documentElement.classList.contains("dark");
    return prefersDark || hasDarkClass ? DARK_FAVICON : LIGHT_FAVICON;
}

function updateFavicons(href: string) {
    const links = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"]'
    );

    links.forEach((link) => {
        link.href = href;
    });

    if (links.length === 0) {
        const iconLink = document.createElement("link");
        iconLink.rel = "icon";
        iconLink.href = href;
        document.head.appendChild(iconLink);

        const shortcutLink = document.createElement("link");
        shortcutLink.rel = "shortcut icon";
        shortcutLink.href = href;
        document.head.appendChild(shortcutLink);
    }
}

export function DynamicFavicon() {
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const sync = () => updateFavicons(resolveFaviconHref());

        sync();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", sync);
        } else {
            mediaQuery.addListener(sync);
        }

        const observer = new MutationObserver(sync);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            if (typeof mediaQuery.removeEventListener === "function") {
                mediaQuery.removeEventListener("change", sync);
            } else {
                mediaQuery.removeListener(sync);
            }
            observer.disconnect();
        };
    }, []);

    return null;
}
