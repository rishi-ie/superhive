import {
  BottomHint,
  ComposerCard,
  SuggestedActions,
  WorkspaceBreadcrumb,
} from "./components";

export function Dashboard() {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[620px] flex-col items-center gap-3">
          <WorkspaceBreadcrumb />
          <ComposerCard />
          <SuggestedActions />
        </div>
      </div>

      <div className="px-6 pb-4">
        <BottomHint />
      </div>
    </div>
  );
}
