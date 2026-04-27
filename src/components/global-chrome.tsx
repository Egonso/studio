"use client";

import { Footer } from "@/components/footer";
import { SiteChatbotWidget } from "@/components/site-chatbot-widget";
import { CommandPalette } from "@/components/register/command-palette";
import { usePathname } from "@/i18n/navigation";
import {
  getProductAreaForPathname,
  isSignedInProductArea,
  showGlobalFooterForPathname,
  showSiteChatbotForPathname,
} from "@/lib/navigation/route-manifest";

export function GlobalChrome() {
  const pathname = usePathname() ?? '/';
  const area = getProductAreaForPathname(pathname);
  const showFooter = showGlobalFooterForPathname(pathname);
  const showChatbot = showSiteChatbotForPathname(pathname);
  const showCommandPalette = isSignedInProductArea(area);

  return (
    <>
      {showCommandPalette ? <CommandPalette /> : null}
      {showChatbot ? <SiteChatbotWidget /> : null}
      {showFooter ? <Footer /> : null}
    </>
  );
}
