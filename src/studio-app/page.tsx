import dynamic from 'next/dynamic';
import PageCanvas from 'prompt-studio-core/src/components/ui/PageCanvas';
import { ToolPageSkeleton } from 'prompt-studio-core/src/components/ui/ViewState';

const PromptGenerator = dynamic(() => import('@/components/PromptGenerator'), {
  loading: () => <ToolPageSkeleton label="Loading generate" />,
});

/** Prompt Studio's home: Generate. (Castcut's home is Film — src/app/page.tsx.) */
export default function Home() {
  return (
    <PageCanvas accent="brand">
      <PromptGenerator />
    </PageCanvas>
  );
}
