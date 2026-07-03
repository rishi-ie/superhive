import {
  BottomHint,
  ComposerCard,
  SuggestedActions,
  TopHandle,
  TopRightControls,
  WorkspaceBreadcrumb,
} from "./components";

export function Dashboard() {
  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      <TopHandle />
      <TopRightControls />

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="flex w-full max-w-[620px] flex-col items-center gap-8">
          <WorkspaceBreadcrumb />
          <ComposerCard />
          <SuggestedActions />
        </div>
      </div>

      <div className="px-8 pb-6">
        <BottomHint />
      </div>
    </div>
  );
}
