'use client';

import MobileStickyQueueBar from 'prompt-studio-core/src/components/MobileStickyQueueBar';
import ToolSetupBanner from 'prompt-studio-core/src/components/ToolSetupBanner';
import WorkflowEditorGraphSection from '@/components/workflow-editor/WorkflowEditorGraphSection';
import { ToolBadge, ToolLayout } from 'prompt-studio-core/src/components/ui/ToolPageShell';
import { TOOL_SETUP_LABELS } from 'prompt-studio-core/src/lib/tool-page-chrome';
import type { useWorkflowEditorToolOrchestration } from '@/hooks/useWorkflowEditorToolOrchestration';

const ACCENT = 'brand' as const;

type Props = ReturnType<typeof useWorkflowEditorToolOrchestration> & { description: string };

export default function WorkflowEditorToolSections({ description, ...vm }: Props) {
  const { actions, nodes, status, onQueue } = vm;

  return (
    <div data-testid="workflow-editor">
      <ToolLayout
        accent={ACCENT}
        badge={<ToolBadge accent={ACCENT}>More tools</ToolBadge>}
        title="Node graph editor"
        description={description}
      >
        <ToolSetupBanner toolLabel={TOOL_SETUP_LABELS.workflowEditor} />
        <WorkflowEditorGraphSection {...vm} />
        <MobileStickyQueueBar
          disabled={nodes.length === 0}
          label="Queue workflow"
          status={actions.comfyUiStatus ?? status}
          primaryGenerate
          onQueue={() => void onQueue()}
        />
      </ToolLayout>
    </div>
  );
}
