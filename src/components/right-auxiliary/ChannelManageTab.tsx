import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { TextInput } from '@/components/ui/TextInput';
import type { CommunicationChannel, ProjectAgent } from '@/data/projects/store';

type ChannelManageTabProps = {
  channel: CommunicationChannel;
  availableAgents: ProjectAgent[];
};

const STATUS_OPTIONS: { value: CommunicationChannel['status']; label: string }[] = [
  { value: 'OPEN',           label: 'Open' },
  { value: 'AWAITING_REPLY', label: 'Awaiting' },
  { value: 'RESOLVED',       label: 'Resolved' },
];

const STATUS_SELECTED: Record<CommunicationChannel['status'], string> = {
  OPEN:           'border-chart-2 bg-chart-2/10 text-chart-2',
  AWAITING_REPLY: 'border-chart-3 bg-chart-3/10 text-chart-3',
  RESOLVED:       'border-muted-foreground/40 bg-muted/10 text-muted-foreground',
};

export function ChannelManageTab({ channel, availableAgents }: ChannelManageTabProps) {
  const [topic, setTopic] = useState(channel.topic);
  const [status, setStatus] = useState(channel.status);
  const [participants, setParticipants] = useState(channel.participants);

  const removeParticipant = (name: string) => setParticipants(prev => prev.filter(p => p !== name));

  const currentParticipantNames = new Set(participants);
  const availableToAdd = availableAgents.filter(a => !currentParticipantNames.has(a.name));

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                status === opt.value
                  ? STATUS_SELECTED[opt.value]
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Topic</label>
        <TextInput
          value={topic}
          onChange={e => setTopic(e.target.value)}
          size="sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Participants ({participants.length})</label>
        <div className="space-y-1">
          {participants.map(name => {
            const agent = availableAgents.find(a => a.name === name);
            return (
              <div key={name} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card">
                <div className="size-4 rounded-full bg-chart-2 flex items-center justify-center text-[8px] font-bold text-sidebar-primary-foreground shrink-0">
                  {agent?.initials ?? name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                <button
                  onClick={() => removeParticipant(name)}
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={12} strokeWidth={STROKE_WIDTH} />
                </button>
              </div>
            );
          })}
        </div>
        {availableToAdd.length > 0 && (
          <select
            className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            onChange={e => {
              if (e.target.value) {
                setParticipants(prev => [...prev, e.target.value]);
                e.target.value = '';
              }
            }}
            value=""
          >
            <option value="">Add participant...</option>
            {availableToAdd.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <button
          type="button"
          className="w-full rounded-md border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          Archive Channel
        </button>
      </div>
    </div>
  );
}
