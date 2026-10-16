import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const PromptFormatter = dynamic(() => import('@/components/PromptFormatter'), {
  loading: () => <ToolPageSkeleton label="Loading format" />,
});

export default function FormatPage() {
  return (
    <PageCanvas accent="emerald">
      <PromptFormatter />
    </PageCanvas>
  );
}
