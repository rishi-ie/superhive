import { HugeiconsIcon } from "@/components/ui/icon";
import {
  PlusSignIcon,
  HandIcon,
  ArrowDown01Icon,
  Mic02Icon,
  NotebookIcon,
} from "@hugeicons/core-free-icons";
import { Send } from "lucide-react";

export function ComposerCard() {
  return (
    <div className="relative w-full max-w-[700px]">
      <div className="relative z-10 rounded-3xl bg-[#2a2a2a]">
        <textarea
          placeholder="Do anything"
          className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm text-white placeholder:text-[#6b7280] outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button className="text-[#9ca3af] hover:text-white cursor-default">
              <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
            </button>
            <button className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white cursor-default">
              <HugeiconsIcon icon={HandIcon} className="size-4" />
              <span>Ask for approval</span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-[#9ca3af] hover:text-white cursor-default">
              <span>5.5 Extra High</span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
            </button>
            <button className="flex size-7 items-center justify-center rounded-full text-[#9ca3af] hover:text-white hover:bg-sidebar-accent cursor-pointer transition-colors">
              <HugeiconsIcon icon={Mic02Icon} className="size-5" />
            </button>
            <button className="flex size-7 items-center justify-center rounded-full text-[#9ca3af] hover:text-white hover:bg-sidebar-accent cursor-pointer transition-colors">
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-0 w-full max-w-[690px] rounded-3xl bg-[#1c1c1c]" />
      <div className="relative z-20 flex items-center gap-2 px-4 py-3 max-w-[690px] mx-auto">
        <HugeiconsIcon icon={NotebookIcon} className="size-4 text-white" />
        <span className="text-sm text-white">Choose project</span>
      </div>
    </div>
  );
}
