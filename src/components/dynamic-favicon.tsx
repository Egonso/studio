"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Dynamically sets the favicon based on the current route.
 * - Register pages (/my-register, /capture, /verify/pass) → register-logo.png
 * - Everything else (dashboard, etc.) → logo.png (blue circle)
 */

const REGISTER_PATHS = ["/my-register", "/capture", "/verify/pass"];

export function DynamicFavicon() {
    const pathname = usePathname();

    useEffect(() => {
        const isRegister = REGISTER_PATHS.some((p) => pathname.startsWith(p));
        const faviconHref = isRegister ? "/register-logo.png" : "/logo.png";

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
    }, [pathname]);

    return null;
}
