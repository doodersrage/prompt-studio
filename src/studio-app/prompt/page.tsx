import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const PromptEditorTool = dynamic(() => import('@/components/PromptEditorTool'), {
  loading: () => <ToolPageSkeleton label="Loading prompt editor" />,
});

export default function PromptPage() {
  return (
    <PageCanvas accent="neutral">
      <PromptEditorTool />
    </PageCanvas>
  );
}
