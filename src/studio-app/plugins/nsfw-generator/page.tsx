import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { EmptyState, ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';
import { isNsfwGeneratorEnabledServer, nsfwGeneratorEnvHint } from 'prompt-studio-core/src/lib/nsfw-generator-env';

const NsfwGeneratorTool = dynamic(() => import('@/components/NsfwGeneratorTool'), {
  loading: () => <ToolPageSkeleton label="Loading adult generator" />,
});

export default function NsfwGeneratorPluginPage() {
  if (!isNsfwGeneratorEnabledServer()) {
    return (
      <PageCanvas accent="fuchsia">
        <EmptyState
          title="Adult generator unavailable"
          description={`This plugin is hidden unless enabled by environment variables. ${nsfwGeneratorEnvHint()}`}
        />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas accent="fuchsia">
      <NsfwGeneratorTool />
    </PageCanvas>
  );
}
