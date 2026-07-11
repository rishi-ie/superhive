import { BottomHint } from "./BottomHint";
import { ComposerCard } from "./ComposerCard";

export function Landing() {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[800px] flex-col items-center gap-8">
          <h1 className="text-4xl font-normal text-foreground">What should we work on?</h1>
          <ComposerCard />
        </div>
      </div>

      <div className="px-6 pb-4">
        <BottomHint />
      </div>
    </div>
  );
}
