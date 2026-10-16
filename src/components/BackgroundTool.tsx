'use client';

import { TOOL_SETUP_LABELS } from 'prompt-studio-core/src/lib/tool-page-chrome';

import { useCallback, useEffect, useState } from 'react';
import BackgroundPresetControls from 'prompt-studio-core/src/components/BackgroundPresetControls';
import { SceneGenerateFooter, SceneQuickTags } from 'prompt-studio-core/src/components/scene-tool/SceneToolSections';
import SceneSetupSection from 'prompt-studio-core/src/components/scene-tool/SceneSetupSection';
import SceneFamilySwitcher from 'prompt-studio-core/src/components/SceneFamilySwitcher';
import ScenePromptResultPanel from 'prompt-studio-core/src/components/scene-tool/ScenePromptResultPanel';
import {
  HistoryHintSeedPanel,
  resolveBackgroundTagsForGeneration,
} from 'prompt-studio-core/src/components/scene-tool/HistoryHintSeedPanel';
import { normalizeHistorySeedScope, normalizeSceneHintSource } from 'prompt-studio-core/src/lib/scene-hint-source';
import { countHistorySeedCandidates, splitBackgroundHintSeed } from 'prompt-studio-core/src/lib/history-hint-seed';
import SharedToolControls from 'prompt-studio-core/src/components/SharedToolControls';
import { useCachedSettings } from 'prompt-studio-core/src/hooks/useCachedSettings';
import { useGalleryHandoff } from 'prompt-studio-core/src/hooks/useGalleryHandoff';
import { useSeedToolDraft } from 'prompt-studio-core/src/hooks/useSeedToolDraft';
import { usePromptResultActions } from 'prompt-studio-core/src/hooks/usePromptResultActions';
import type { ComfyImageModel } from 'prompt-studio-core/src/lib/comfy-models/client';
import { useRecentLocations } from 'prompt-studio-core/src/hooks/useRecentLocations';
import { useLocationBlocklist } from 'prompt-studio-core/src/hooks/useLocationBlocklist';
import { presetOptionsFromBackgroundCache } from 'prompt-studio-core/src/lib/background-options';
import { readSceneLocationFromMetadata } from 'prompt-studio-core/src/lib/recent-locations';
import { getComfyModelDefinition } from 'prompt-studio-core/src/lib/comfy-models/client';
import { getReformatTargetModel } from 'prompt-studio-core/src/lib/reformat-target';
import { rememberDraftFields } from 'prompt-studio-core/src/lib/remember-draft-fields';
import {
  applyBackgroundHintsFromSearchParams,
  applyHintSourceFromSearchParams,
} from 'prompt-studio-core/src/lib/tool-url-params';
import { avoidedTokensRequestBody } from 'prompt-studio-core/src/lib/avoided-tokens';
import { sharedLlmRequestBody } from 'prompt-studio-core/src/lib/llm-request-options';
import { DEFAULT_BACKGROUND_TOOL_CACHE } from 'prompt-studio-core/src/lib/settings-cache';
import type { EnrichedToolGenerateResult } from 'prompt-studio-core/src/lib/specialized/types';
import ToolSetupBanner from 'prompt-studio-core/src/components/ToolSetupBanner';
import {
  ToolBadge,
  CollapsibleSection,
  ToolLayout,
  accentFocusClass,
} from 'prompt-studio-core/src/components/ui/ToolPageShell';
import { useToolPageDescription } from 'prompt-studio-core/src/hooks/useToolPageDescription';
import { FieldDivider } from 'prompt-studio-core/src/components/ui/Field';
import { ButtonLink } from 'prompt-studio-core/src/components/ui/Button';
import { galleryPickPath } from 'prompt-studio-core/src/lib/gallery-handoff';

const ACCENT = 'teal' as const;

export default function BackgroundTool() {
  const description = useToolPageDescription(
    'Environment-only prompts — no people. Add tags or presets, then generate.',
    'Environment-only scenes — no people. Tags or presets, then generate.'
  );
  const { mounted, shared, toolSettings, updateShared, updateToolSettings } = useCachedSettings(
    'background',
    DEFAULT_BACKGROUND_TOOL_CACHE
  );
  const { getRecent, record } = useRecentLocations();
  const { getBlocklist } = useLocationBlocklist();
  const [output, setOutput] = useState('');
  const [result, setResult] = useState<EnrichedToolGenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useSeedToolDraft(mounted, {
    toolKey: 'background',
    label: 'Background',
    href: '/background',
    fields: [toolSettings.settingType, toolSettings.timeOfDay, toolSettings.mood],
  });

  const actions = usePromptResultActions({
    tool: 'background',
    model: shared.model,
    detail: shared.detail,
    hints: [toolSettings.settingType, toolSettings.timeOfDay, toolSettings.mood]
      .filter(Boolean)
      .join(', '),
    autoFixRules: shared.autoFixRules !== false,
    reformatTarget: getReformatTargetModel(shared.model),
  });

  const selectedModel = getComfyModelDefinition(shared.model);
  const hintSource = normalizeSceneHintSource(toolSettings.hintSource);
  const historySeedScope = normalizeHistorySeedScope(toolSettings.historySeedScope);
  const historyCandidateCount = countHistorySeedCandidates('background', historySeedScope);
  const generateDisabledReason =
    hintSource === 'history' && historyCandidateCount === 0
      ? 'Save a few background prompts to Studio history first, or switch hint source.'
      : null;
  const quickTagHints = [toolSettings.settingType, toolSettings.timeOfDay, toolSettings.mood]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    applyHintSourceFromSearchParams(params, updateToolSettings);
    applyBackgroundHintsFromSearchParams(params, updateToolSettings);
    const seed = params.get('seed');
    if (seed?.trim()) {
      updateShared({ lockedVariationSeed: seed.trim() });
    }
  }, [updateShared, updateToolSettings]);

  const applyGalleryHandoff = useCallback(
    (handoff: { prompt: string; model?: string; payload: { hints?: string } }) => {
      const seed = handoff.payload.hints?.trim() || handoff.prompt.trim();
      if (seed) {
        const tags = splitBackgroundHintSeed(seed);
        updateToolSettings({
          settingType: tags.settingType,
          timeOfDay: tags.timeOfDay,
          mood: tags.mood,
          hintSource: 'manual',
        });
      }
      if (handoff.model) {
        updateShared({ model: handoff.model as ComfyImageModel });
      }
      if (handoff.prompt.trim()) {
        setOutput(handoff.prompt.trim());
      }
    },
    [updateShared, updateToolSettings]
  );
  useGalleryHandoff('background', applyGalleryHandoff);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    actions.resetStatuses();

    try {
      const tags = resolveBackgroundTagsForGeneration({
        hintSource,
        settingType: toolSettings.settingType,
        timeOfDay: toolSettings.timeOfDay,
        mood: toolSettings.mood,
        randomTheme: toolSettings.randomTheme,
      });
      const response = await fetch('/api/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: shared.model,
          detail: shared.detail,
          settingType: tags.settingType,
          timeOfDay: tags.timeOfDay,
          mood: tags.mood,
          presetOptions: presetOptionsFromBackgroundCache(toolSettings),
          recentLocations: getRecent(),
          blockedLocations: getBlocklist(),
          ...avoidedTokensRequestBody(),
          ...sharedLlmRequestBody(shared),
        }),
      });

      const data = (await response.json()) as EnrichedToolGenerateResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Generation failed.');
      }

      record(readSceneLocationFromMetadata(data.metadata));

      const prompt = await actions.finalizePrompt(data.prompt);
      setOutput(prompt);
      setResult({ ...data, prompt });
    } catch (err) {
      setOutput('');
      setResult(null);
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }, [shared, toolSettings, hintSource, getRecent, record, getBlocklist, actions]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }, [output]);

  return (
    <ToolLayout
      accent={ACCENT}
      badge={<ToolBadge accent={ACCENT}>Create</ToolBadge>}
      title="Background"
      description={description}
      sidebarPersistKey="background"
      sidebar={
        <SharedToolControls
          shared={shared}
          onModelChange={model => updateShared({ model })}
          onDetailChange={detail => updateShared({ detail })}
          onWorkflowPresetChange={id => updateShared({ selectedWorkflowFileId: id })}
          lockedLocation={shared.lockedLocation}
          onClearLockedLocation={() => updateShared({ lockedLocation: undefined })}
          autoFixRules={shared.autoFixRules !== false}
          onAutoFixRulesChange={value => updateShared({ autoFixRules: value })}
          recommendFromText={output}
        />
      }
    >
      <ToolSetupBanner toolLabel={TOOL_SETUP_LABELS.background} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ButtonLink href={galleryPickPath('background')} variant="secondary" size="sm">
          Seed from Gallery
        </ButtonLink>
        <p className="type-caption text-[var(--text-muted)]">
          Opens Gallery in pick mode to load prompt and hints into this setup.
        </p>
      </div>
      <SceneSetupSection
        title="Environment setup"
        description="Quick tags and optional presets — no people."
      >
        <SceneFamilySwitcher />
        <HistoryHintSeedPanel
          tool="background"
          hintSource={hintSource}
          historySeedScope={historySeedScope}
          hints={quickTagHints}
          randomTheme={toolSettings.randomTheme ?? ''}
          lastHistorySeedEntryId={toolSettings.lastHistorySeedEntryId}
          onHintSourceChange={source => updateToolSettings({ hintSource: source })}
          onHistorySeedScopeChange={scope => updateToolSettings({ historySeedScope: scope })}
          onHintsChange={value => {
            const tags = splitBackgroundHintSeed(value);
            updateToolSettings({
              settingType: tags.settingType,
              timeOfDay: tags.timeOfDay,
              mood: tags.mood,
            });
            rememberDraftFields({
              toolKey: 'background',
              label: 'Background',
              href: '/background',
              fields: [value],
            });
          }}
          onRandomThemeChange={value => updateToolSettings({ randomTheme: value })}
          onHistorySeedApplied={result => {
            const tags = splitBackgroundHintSeed(result.hints);
            updateToolSettings({
              settingType: tags.settingType,
              timeOfDay: tags.timeOfDay,
              mood: tags.mood,
              lastHistorySeedEntryId: result.entryId,
            });
          }}
          accentFocusClassName={accentFocusClass(ACCENT)}
        />

        {hintSource !== 'random' ? (
          <CollapsibleSection
            title="Environment presets"
            summary="Quick tags and structured lighting, depth, and surface options."
            defaultOpen={false}
            persistKey="background-presets"
          >
            <SceneQuickTags
              settingType={toolSettings.settingType ?? ''}
              timeOfDay={toolSettings.timeOfDay ?? ''}
              mood={toolSettings.mood ?? ''}
              onSettingTypeChange={value => updateToolSettings({ settingType: value })}
              onTimeOfDayChange={value => updateToolSettings({ timeOfDay: value })}
              onMoodChange={value => updateToolSettings({ mood: value })}
              inputClassName={accentFocusClass(ACCENT)}
            />

            <FieldDivider />

            <BackgroundPresetControls
              mounted={mounted}
              settings={toolSettings}
              onChange={updateToolSettings}
            />
          </CollapsibleSection>
        ) : null}

        <SceneGenerateFooter
          accent={ACCENT}
          label="Generate background prompt"
          onClick={() => void generate()}
          disabled={!mounted || Boolean(generateDisabledReason)}
          loading={loading}
          loadingLabel="Generating background prompt"
          error={error ?? generateDisabledReason}
        />
      </SceneSetupSection>

      <ScenePromptResultPanel
        output={output}
        onOutputChange={setOutput}
        result={result}
        copied={copied}
        onCopy={() => void copyOutput()}
        actions={actions}
        shared={shared}
        selectedComfyNode={selectedModel.comfyNode}
        hints={[toolSettings.settingType, toolSettings.mood].filter(Boolean).join(', ')}
        passHintsToFix={false}
        queueLabel="Queue background"
        includeEditPrompt={false}
        includeVariationSeed={false}
      />
    </ToolLayout>
  );
}
