import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const WorkflowEditorTool = dynamic(() => import('@/components/WorkflowEditorTool'), {
  loading: () => <ToolPageSkeleton label="Loading workflow editor" />,
});

export default function WorkflowEditorPage() {
  return (
    <PageCanvas accent="brand">
      <WorkflowEditorTool />
    </PageCanvas>
  );
}
