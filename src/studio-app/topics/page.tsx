import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const TopicTool = dynamic(() => import('@/components/TopicTool'), {
  loading: () => <ToolPageSkeleton label="Loading topics" />,
});

export default function TopicsPage() {
  return (
    <PageCanvas accent="brand">
      <TopicTool />
    </PageCanvas>
  );
}
