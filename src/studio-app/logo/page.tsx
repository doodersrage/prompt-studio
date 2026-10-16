import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const LogoTool = dynamic(() => import('@/components/LogoTool'), {
  loading: () => <ToolPageSkeleton label="Loading logo" />,
});

export default function LogoPage() {
  return (
    <PageCanvas accent="amber">
      <LogoTool />
    </PageCanvas>
  );
}
