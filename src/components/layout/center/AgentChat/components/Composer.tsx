import { useState, useRef, useEffect } from "react";
import { Paperclip, ImageIcon, ChevronDown, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MODELS = [
  { label: "Claude Opus 4", value: "opus-4" },
  { label: "Claude Sonnet 4", value: "sonnet-4" },
  { label: "Claude Haiku", value: "haiku" },
];

export function Composer() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="border-t border-border/50 shrink-0">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="rounded-2xl bg-card">
          <div className="px-4 pt-3 pb-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask your digital employee to build, fix, research or automate…"
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-[14px] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Paperclip className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <ImageIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add image</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 text-[12px] gap-1 text-muted-foreground hover:text-foreground">
                    {MODELS[0]?.label}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {MODELS.map((model) => (
                    <DropdownMenuItem key={model.value}>{model.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" className="h-8 text-[12px] gap-1.5 px-3">
                <Play className="size-3.5" />
                Run
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
