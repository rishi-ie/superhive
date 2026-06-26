/**
 * Command — command palette built on cmdk + Radix Dialog.
 * Provides keyboard-navigable command/search interface.
 */
import React, { type ReactNode } from 'react';
import { Command as CmdkCommand } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const Command = CmdkCommand;

const CommandDialog = DialogPrimitive.Dialog;

const CommandDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    commandProps?: React.ComponentPropsWithoutRef<typeof CmdkCommand>;
  }
>(({ className, children, commandProps, ...props }, ref) => (
  <DialogPrimitive.DialogContent ref={ref} className={cn('overflow-hidden p-0', className)} {...props}>
    <div className="flex items-center border-b border-border px-3 gap-2">
      <Search size={14} className="shrink-0 text-muted-foreground" />
      <CmdkCommand className="flex h-10 w-full py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 [&_[cmdk-input-wrapper]]:hidden">
        <input
          cmdk-input-wrapper=""
          className="flex h-full w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Type a command or search..."
        />
        {children}
      </CmdkCommand>
      <DialogPrimitive.DialogTitle className="sr-only">Command Menu</DialogPrimitive.DialogTitle>
    </div>
  </DialogPrimitive.DialogContent>
));
CommandDialogContent.displayName = 'CommandDialogContent';

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.Input>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.Input>
>(({ className, ...props }, ref) => (
  <CmdkCommand.Input ref={ref} className={cn('flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
));
CommandInput.displayName = CmdkCommand.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.List>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.List>
>(({ className, ...props }, ref) => (
  <CmdkCommand.List ref={ref} className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props} />
));
CommandList.displayName = CmdkCommand.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.Empty>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.Empty>
>(({ className, ...props }, ref) => (
  <CmdkCommand.Empty ref={ref} className={cn('py-6 text-center text-sm text-muted-foreground', className)} {...props} />
));
CommandEmpty.displayName = CmdkCommand.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.Group>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.Group>
>(({ className, ...props }, ref) => (
  <CmdkCommand.Group
    ref={ref}
    className={cn('overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground', className)}
    {...props}
  />
));
CommandGroup.displayName = CmdkCommand.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.Item>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.Item>
>(({ className, ...props }, ref) => (
  <CmdkCommand.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer gap-2 w-full select-none items-center rounded-md px-2 py-1.5 text-sm outline-none',
      'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CmdkCommand.Item.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CmdkCommand.Separator>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand.Separator>
>(({ className, ...props }, ref) => (
  <CmdkCommand.Separator ref={ref} className={cn('-mx-1 h-px bg-border', className)} {...props} />
));
CommandSeparator.displayName = CmdkCommand.Separator.displayName;

const CommandShortcut = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}>{children}</span>
);
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandDialog,
  CommandDialogContent,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
