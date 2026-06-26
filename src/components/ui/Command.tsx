/**
 * Command — lightweight dialog-based command palette.
 * Note: For full cmdk integration, add `cmdk` package.
 */
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';

const Command = DialogPrimitive.Root;
const CommandTrigger = DialogPrimitive.Trigger;
const CommandDialog = DialogPrimitive.Dialog;

const CommandDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.DialogContent ref={ref} className={className} {...props}>
    <div className="flex items-center border-b border-border px-3">
      <Search size={14} className="mr-2 shrink-0 text-muted-foreground" />
      <DialogPrimitive.DialogTitle className="sr-only">Command Menu</DialogPrimitive.DialogTitle>
      <input
        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Type a command or search..."
      />
    </div>
    {children}
  </DialogPrimitive.DialogContent>
));
CommandDialogContent.displayName = 'CommandDialogContent';

export { Command, CommandTrigger, CommandDialog, CommandDialogContent };
