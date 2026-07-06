import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { UserIcon, PlusSignIcon, PinIcon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { AccordionSection, AccordionRow, EmptyCtaButton } from '@/components/layout/common/primitives';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import type { Agent } from '@/types/electron';

interface AgentsSectionProps {
  items: Agent[];
}

const AgentActions = () => (
  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
    <div className="flex size-5 cursor-default items-center justify-center rounded-sm text-[#727272] hover:bg-sidebar-accent hover:text-[#dedede]">
      <HugeiconsIcon icon={PinIcon} className="size-3.5" />
    </div>
    <div className="flex size-5 cursor-default items-center justify-center rounded-sm text-[#727272] hover:bg-sidebar-accent hover:text-[#dedede]">
      <HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5" />
    </div>
  </span>
);

export function AgentsSection({ items }: AgentsSectionProps) {
  const navigate = useNavigate();
  const { setOpen } = useOpenCreateAgent();

  return (
    <AccordionSection label="Agents">
      {items.length > 0
        ? items.map((a) => (
            <AccordionRow
              key={a.id}
              icon={<HugeiconsIcon icon={UserIcon} className="size-4 flex-shrink-0" />}
              label={a.name}
              trailing={<AgentActions />}
              onClick={() => navigate(`/agents/${a.id}`)}
            />
          ))
        : (
            <EmptyCtaButton
              icon={<HugeiconsIcon icon={PlusSignIcon} className="size-4 flex-shrink-0" />}
              label="New agent"
              onClick={() => setOpen(true)}
            />
          )}
    </AccordionSection>
  );
}