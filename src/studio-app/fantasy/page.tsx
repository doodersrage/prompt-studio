import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const FantasyTool = dynamic(() => import('@/components/FantasyTool'), {
  loading: () => <ToolPageSkeleton label="Loading fantasy" />,
});

export default function FantasyPage() {
  return (
    <PageCanvas accent="brand">
      <FantasyTool />
    </PageCanvas>
  );
}
