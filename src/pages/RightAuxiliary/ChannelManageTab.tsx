/**
 * Channel management tab — status, topic, and participant management with save/cancel.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { TextInput } from '@/components/ui/TextInput';
import { SaveBar } from '@/components/ui/SaveBar';
import { useToast } from '@/toasts/context';
import { updateChannel } from '@/data/channel/store';
import { listProjectAgents } from '@/data/project/store';
import { addChannelParticipant, removeChannelParticipant } from '@/data/channel_participant/store';
import type { CommunicationChannel, ProjectAgent } from '@/data/project/store';

type ChannelManageTabProps = {
  channel: CommunicationChannel;
  projectId?: string;
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
 * Channel management tab — status, topic, description, and participant management.
 * @param channel - Channel to manage
 * @param availableAgents - Agents available to add as participants
 */
export function ChannelManageTab({ channel, projectId, availableAgents }: ChannelManageTabProps) {
  const [topic, setTopic] = useState(channel.topic);
  const [status, setStatus] = useState(channel.status);
  const [participants, setParticipants] = useState(channel.participants);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  const markDirty = (updater: () => void) => {
    updater();
    setIsDirty(true);
  };

  const handleSave = () => {
    const updated = projectId ? updateChannel(channel.id, { topic, status, participants }) : undefined;
    if (updated) {
      if (projectId) {
        const projectAgents = listProjectAgents(projectId);
        const currentNames = new Set(participants);
        const originalNames = new Set(channel.participants);
        const addedNames = participants.filter(n => !originalNames.has(n));
        const removedNames = channel.participants.filter(n => !currentNames.has(n));
        for (const name of addedNames) {
          const agent = projectAgents.find(a => a.name === name);
          if (agent) addChannelParticipant({ channelId: channel.id, agentId: agent.id, type: 'agent', canRead: true, canWrite: true });
        }
        for (const name of removedNames) {
          const agent = projectAgents.find(a => a.name === name);
          if (agent) removeChannelParticipant(channel.id, agent.id, 'agent');
        }
      }
      toast({ title: 'Saved', description: channel.topic });
    } else {
      toast({ title: 'Error', description: 'Failed to save channel' });
    }
    setIsDirty(false);
  };

  const handleCancel = () => {
    setTopic(channel.topic);
    setStatus(channel.status);
    setParticipants(channel.participants);
    setIsDirty(false);
  };

  const removeParticipant = (name: string) => markDirty(() => setParticipants(prev => prev.filter(p => p !== name)));
  const addParticipant = (name: string) => markDirty(() => setParticipants(prev => [...prev, name]));

  const currentParticipantNames = new Set(participants);
  const availableToAdd = availableAgents.filter(a => !currentParticipantNames.has(a.name));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</label>
          <div className="flex rounded-md border border-border/40 overflow-hidden">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => markDirty(() => setStatus(opt.value))}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                  status === opt.value
                    ? STATUS_SELECTED[opt.value]
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-hover-tint'
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
            onChange={e => markDirty(() => setTopic(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">
            Participants ({participants.length})
          </label>
          <div className="space-y-1">
            {participants.map(name => {
              return (
                <div
                  key={name}
                  className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors cursor-default"
                >
                  <Avatar
                    name={name}
                    size="xs3"
                    color="bg-chart-2"
                    className="font-bold text-sidebar-primary-foreground"
                  />
                  <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(name)}
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} strokeWidth={STROKE_WIDTH} />
                  </IconButton>
                </div>
              );
            })}
          </div>
          {availableToAdd.length > 0 && (
            <Select
              value=""
              onChange={addParticipant}
              options={[{ value: '', label: 'Add participant...' }, ...availableToAdd.map(a => ({ value: a.name, label: a.name }))]}
            />
          )}
        </div>

      </div>

      <SaveBar
        onSave={handleSave}
        onCancel={handleCancel}
        disabled={!isDirty}
        variant="inline"
      />
    </div>
  );
}
