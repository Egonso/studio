"use client";

import { useEffect } from "react";

export function DynamicFavicon() {
    useEffect(() => {
        const faviconHref = "/register-logo.png";

        // Update all favicon link elements
        const links = document.querySelectorAll<HTMLLinkElement>(
            'link[rel="icon"], link[rel="shortcut icon"]'
        );
        links.forEach((link) => {
            link.href = faviconHref;
        });

        // If no link elements exist, create them
        if (links.length === 0) {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = faviconHref;
            document.head.appendChild(link);
        }
    }, []);

    return null;
}
