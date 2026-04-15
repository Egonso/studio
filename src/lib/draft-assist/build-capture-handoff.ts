import {
  buildRegisterCaptureFromManifest,
  parseStudioUseCaseManifest,
} from '@/lib/agent-kit/manifest';
import { parseCaptureInput } from '@/lib/register-first';

import {
  DraftAssistHandoffSchema,
  normalizeDraftAssistDraft,
  type DraftAssistDraft,
  type DraftAssistHandoff,
} from './types';

export function buildDraftAssistCaptureHandoff(
  draftInput: DraftAssistDraft,
): DraftAssistHandoff {
  const manifest = normalizeDraftAssistDraft(draftInput);
  const parsedManifest = parseStudioUseCaseManifest(manifest);
  const captureInput = parseCaptureInput(
    buildRegisterCaptureFromManifest(parsedManifest),
  );

  return DraftAssistHandoffSchema.parse({
    source: 'draft_assist_v1',
    manifest,
    captureInput,
  });
}
