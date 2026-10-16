import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const ImagePromptTool = dynamic(() => import('@/components/ImagePromptTool'), {
  loading: () => <ToolPageSkeleton label="Loading image prompt" />,
});

export default function ImagePromptPage() {
  return (
    <PageCanvas accent="fuchsia">
      <ImagePromptTool />
    </PageCanvas>
  );
}
