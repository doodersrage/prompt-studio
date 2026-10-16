import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { StudioTabSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const StudioTool = dynamic(() => import('@/components/StudioTool'), {
  loading: () => (
    <PageCanvas accent="brand">
      <StudioTabSkeleton />
    </PageCanvas>
  ),
});

export default function StudioPage() {
  return (
    <PageCanvas accent="brand">
      <StudioTool />
    </PageCanvas>
  );
}
