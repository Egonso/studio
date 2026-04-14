import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers for Next.js navigation
// Use these instead of next/navigation in app components
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
