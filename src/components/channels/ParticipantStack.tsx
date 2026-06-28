/**
 * Horizontal overlapping avatar stack for group channel participant display.
 * Shows up to max avatars with a +N overflow chip when there are more participants.
 */
import { Avatar } from '@/components/ui/Avatar';
import { getInitials } from '@/lib/initials';

type ParticipantStackProps = {
  participants: string[];
  agentMap: Record<string, { initials: string; id: string }>;
  max?: number;
};

/**
 * Horizontal overlapping avatar stack.
 * @param participants - Ordered list of participant names
 * @param agentMap - Lookup from name → { initials, id }
 * @param max - Maximum avatars to show (default 3); overflow shown as +N chip
 */
export function ParticipantStack({ participants, agentMap, max = 3 }: ParticipantStackProps) {
  const visible = participants.slice(0, max);
  const overflow = participants.length - max;

  return (
    <div className="flex items-center shrink-0 gap-1.5">
      {visible.map((name) => {
        const agent = agentMap[name];
        const initials = agent?.initials ?? getInitials(name);
        return (
          <Avatar
            key={name}
            size="xs"
            fallback={initials}
            className="ring-1 ring-card shrink-0"
          />
        );
      })}
      {overflow > 0 && (
        <div className="flex items-center justify-center size-7 rounded-full bg-secondary border border-card text-[10px] font-semibold text-muted-foreground shrink-0">
          +{overflow}
        </div>
      )}
    </div>
  );
}
