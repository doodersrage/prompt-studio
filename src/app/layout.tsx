import type { Metadata, Viewport } from 'next';
import RootDocument from 'prompt-studio-core/src/components/RootDocument';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from 'prompt-studio-core/src/lib/brand';
import { ROOT_VIEWPORT, rootMetadata } from 'prompt-studio-core/src/lib/root-metadata';
import './globals.css';

export const metadata: Metadata = rootMetadata(PRODUCT_NAME, PRODUCT_TAGLINE);

export const viewport: Viewport = ROOT_VIEWPORT;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument>{children}</RootDocument>;
}
