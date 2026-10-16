import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const VariationGridTool = dynamic(() => import('@/components/VariationGridTool'), {
  loading: () => <ToolPageSkeleton label="Loading variations" />,
});

export default function VariationsPage() {
  return (
    <PageCanvas accent="brand">
      <VariationGridTool />
    </PageCanvas>
  );
}
