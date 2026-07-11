import { Icon } from "@/components/ui/icon";
import {
  PlusIcon,
  HandIcon,
  CaretDownIcon,
  MicrophoneIcon,
  NotebookIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { ModelPicker } from "@/components/layout/composer/ModelPicker";

export function ComposerCard() {
  return (
    <div className="relative w-full max-w-[700px]">
      <div className="relative z-10 rounded-3xl bg-sidebar">
        <textarea
          placeholder="Do anything"
          className="min-h-[60px] w-full resize-none border-0 bg-transparent px-composer py-4 text-sm text-sidebar-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex items-center justify-between px-composer py-3">
          <div className="flex items-center gap-4">
            <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default">
              <Icon icon={PlusIcon} className="size-5" />
            </button>
            <button className="flex items-center gap-list-item text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default">
              <Icon icon={HandIcon} className="size-4" />
              <span>Ask for approval</span>
              <Icon icon={CaretDownIcon} className="size-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <ModelPicker />
            <button className="flex size-7 items-center justify-center rounded-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors">
              <Icon icon={MicrophoneIcon} className="size-5" />
            </button>
            <button className="flex size-7 items-center justify-center rounded-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors">
              <Icon icon={PaperPlaneTiltIcon} className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-0 w-full max-w-[690px] rounded-3xl bg-sidebar/70" />
      <div className="relative z-20 flex items-center gap-stack px-composer py-3 max-w-[690px] mx-auto">
        <Icon icon={NotebookIcon} className="size-4 text-foreground" />
        <span className="text-sm text-foreground">Choose project</span>
      </div>
    </div>
  );
}
