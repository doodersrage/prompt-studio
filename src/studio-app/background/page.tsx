import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const BackgroundTool = dynamic(() => import('@/components/BackgroundTool'), {
  loading: () => <ToolPageSkeleton label="Loading background" />,
});

export default function BackgroundPage() {
  return (
    <PageCanvas accent="teal">
      <BackgroundTool />
    </PageCanvas>
  );
}
