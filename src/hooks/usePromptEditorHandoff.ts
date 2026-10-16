'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  clearGalleryHandoff,
  loadGalleryHandoff,
  type GalleryHandoffPayload,
} from 'prompt-studio-core/src/lib/gallery-handoff';
import { scheduleAfterCommit } from 'prompt-studio-core/src/lib/schedule-after-commit';

export type PromptEditorHandoffMeta = {
  source: GalleryHandoffPayload['source'];
  galleryEntryId?: string;
  historyId?: string;
  imageUrl?: string;
  tool?: string;
};

export function usePromptEditorHandoff(
  onReady: (payload: {
    positive: string;
    negative: string;
    hints: string;
    model?: string;
    meta: PromptEditorHandoffMeta;
  }) => void
): void {
  const appliedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  useLayoutEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (appliedRef.current || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from !== 'gallery' && from !== 'history') {
      return;
    }

    const payload = loadGalleryHandoff('promptEditor');
    if (!payload) {
      return;
    }
    if (from === 'history' && payload.source !== 'history') {
      return;
    }
    if (from === 'gallery' && payload.source !== 'gallery') {
      return;
    }

    appliedRef.current = true;
    scheduleAfterCommit(() => {
      onReadyRef.current({
        positive: payload.prompt,
        negative: payload.negativePrompt ?? '',
        hints: payload.hints ?? '',
        model: payload.model,
        meta: {
          source: payload.source,
          galleryEntryId: payload.galleryEntryId,
          historyId: payload.historyId,
          imageUrl: payload.imageUrl,
          tool: payload.tool,
        },
      });
      clearGalleryHandoff();
    });
  }, []);
}
