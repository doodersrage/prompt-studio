import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const AudioPromptTool = dynamic(() => import('@/components/AudioPromptTool'), {
  loading: () => <ToolPageSkeleton label="Loading audio" />,
});

export default function AudioPage() {
  return (
    <PageCanvas accent="sky">
      <AudioPromptTool />
    </PageCanvas>
  );
}
