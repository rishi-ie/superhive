/**
 * Channel management tab — status, topic, and participant management.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
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

/**
 * Channel management tab — status, topic, and participant management.
 * @param channel - Channel to manage
 * @param availableAgents - Agents available to add as participants
 */
export function ChannelManageTab({ channel, availableAgents }: ChannelManageTabProps) {
  const [topic, setTopic] = useState(channel.topic);
  const [status, setStatus] = useState(channel.status);
  const [participants, setParticipants] = useState(channel.participants);

  const removeParticipant = (name: string) => setParticipants(prev => prev.filter(p => p !== name));

  const currentParticipantNames = new Set(participants);
  const availableToAdd = availableAgents.filter(a => !currentParticipantNames.has(a.name));

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Status</label>
        <div className="flex rounded-md border border-border/40 overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                status === opt.value
                  ? STATUS_SELECTED[opt.value]
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="w-full bg-transparent border-0 rounded-md px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring hover:bg-white/5 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">
          Participants ({participants.length})
        </label>
        <div className="space-y-1">
          {participants.map(name => {
            const agent = availableAgents.find(a => a.name === name);
            return (
              <div
                key={name}
                className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors cursor-default"
              >
                <div className="size-5 rounded-full bg-chart-2 flex items-center justify-center text-[8px] font-bold text-sidebar-primary-foreground shrink-0">
                  {agent?.initials ?? name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                <button
                  onClick={() => removeParticipant(name)}
                  type="button"
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <X size={12} strokeWidth={STROKE_WIDTH} />
                </button>
              </div>
            );
          })}
        </div>
        {availableToAdd.length > 0 && (
          <select
            className="w-full rounded-md border border-border/40 bg-input px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-white/5 transition-colors"
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
    </div>
  );
}
