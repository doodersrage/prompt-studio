import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const OutpaintTool = dynamic(() => import('@/components/OutpaintTool'), {
  loading: () => <ToolPageSkeleton label="Loading outpaint" />,
});

export default function OutpaintPage() {
  return (
    <PageCanvas accent="amber">
      <OutpaintTool />
    </PageCanvas>
  );
}
