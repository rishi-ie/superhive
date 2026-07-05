import { useState } from 'react';
import { Bot, ChevronRight, FolderOpen, Hash, Pin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const BTN_BASE =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#dedede] transition-colors hover:bg-sidebar-accent hover:text-foreground';

function AccordionSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[#727272] transition-colors"
      >
        <span className="truncate text-left">{label}</span>
        <ChevronRight
          className={cn(
            'size-4 flex-shrink-0 transition-transform duration-150',
            open && 'rotate-90'
          )}
        />
      </button>

      <div
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-150 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 pl-2">
          <div className="flex flex-col gap-0.5 py-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  icon,
  label,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button type="button" className={BTN_BASE}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}

function EmptyCtaButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button type="button" className={BTN_BASE}>
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}

const agents: { id: string; name: string }[] = [];
const projects: { id: string; name: string }[] = [];
const channels: { id: string; name: string }[] = [];
const pinned: { id: string; name: string }[] = [];

export function SidebarAccordion() {
  return (
    <div className="flex flex-col gap-1 px-2">
      {pinned.length > 0 && (
        <AccordionSection label="Pinned">
          {pinned.map((p) => (
            <ItemRow
              key={p.id}
              icon={<Pin className="size-4 flex-shrink-0" />}
              label={p.name}
            />
          ))}
        </AccordionSection>
      )}

      <AccordionSection label="Agents">
        {agents.length > 0
          ? agents.map((a) => (
              <ItemRow
                key={a.id}
                icon={<Bot className="size-4 flex-shrink-0" />}
                label={a.name}
              />
            ))
          : <EmptyCtaButton icon={<Plus className="size-4 flex-shrink-0" />} label="New agent" />}
      </AccordionSection>

      <AccordionSection label="Projects">
        {projects.length > 0
          ? projects.map((p) => (
              <ItemRow
                key={p.id}
                icon={<FolderOpen className="size-4 flex-shrink-0" />}
                label={p.name}
              />
            ))
          : <EmptyCtaButton icon={<Plus className="size-4 flex-shrink-0" />} label="New project" />}
      </AccordionSection>

      <AccordionSection label="Channels">
        {channels.map((c) => (
          <ItemRow
            key={c.id}
            icon={<Hash className="size-4 flex-shrink-0" />}
            label={c.name}
          />
        ))}
      </AccordionSection>
    </div>
  );
}
