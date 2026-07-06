import * as React from 'react'
import { useAgentSettings } from '@/flows/agents/settings/use-agent-settings'
import { updateAgentSettings } from '@/flows/agents/settings/update-agent-settings'
import type { AgentSettingsState } from '@/flows/agents/settings'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings } from 'lucide-react'

const MODEL_PROVIDERS = [
  { value: 'minimax', label: 'MiniMax' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
  { value: 'deepseek', label: 'DeepSeek' },
]

interface FormState {
  name: string
  description: string
  systemPrompt: string
  modelProvider: string
  modelName: string
  permissionFilesystem: boolean
  permissionTerminal: boolean
  permissionNetwork: boolean
}

function settingsToForm(s: AgentSettingsState | null): FormState {
  return {
    name: s?.name ?? '',
    description: s?.description ?? '',
    systemPrompt: s?.systemPrompt ?? '',
    modelProvider: s?.model?.provider ?? 'minimax',
    modelName: s?.model?.name ?? '',
    permissionFilesystem: s?.permissions?.filesystem ?? true,
    permissionTerminal: s?.permissions?.terminal ?? true,
    permissionNetwork: s?.permissions?.network ?? true,
  }
}

function formToPatch(form: FormState): Partial<AgentSettingsState> {
  return {
    name: form.name,
    description: form.description,
    systemPrompt: form.systemPrompt,
    model: { provider: form.modelProvider, name: form.modelName },
    permissions: {
      filesystem: form.permissionFilesystem,
      terminal: form.permissionTerminal,
      network: form.permissionNetwork,
    },
  }
}

interface AgentSettingsPanelProps {
  agentId: string
}

export function AgentSettingsPanel({ agentId }: AgentSettingsPanelProps) {
  const { settings, isLoading, error, reload } = useAgentSettings(agentId)
  const [form, setForm] = React.useState<FormState>(settingsToForm(null))
  const [isSaving, setIsSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading && settings) {
      setForm(settingsToForm(settings))
      setDirty(false)
    }
  }, [isLoading, settings])

  const handleSave = async () => {
    setIsSaving(true)
    await updateAgentSettings({ agentId, patch: formToPatch(form) })
    await reload()
    setDirty(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    if (settings) {
      setForm(settingsToForm(settings))
      setDirty(false)
    }
  }

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="text-xs text-muted-foreground">{error ?? 'No settings found'}</p>
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <Settings className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Agent Settings</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="name">Name</Label>
            <Input
              id="name"
              className="h-8 text-sm"
              value={form.name}
              onChange={e => void update('name', e.target.value)}
              placeholder="Agent name"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="description">Description</Label>
            <Input
              id="description"
              className="h-8 text-sm"
              value={form.description}
              onChange={e => void update('description', e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs">Model Provider</Label>
            <Select
              value={form.modelProvider}
              onValueChange={v => void update('modelProvider', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              className="h-8 text-sm"
              value={form.modelName}
              onChange={e => void update('modelName', e.target.value)}
              placeholder="e.g. MiniMax-M2.7"
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              className="min-h-[80px] text-sm resize-none"
              value={form.systemPrompt}
              onChange={e => void update('systemPrompt', e.target.value)}
              placeholder="You are a..."
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs">Permissions</Label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Filesystem</span>
              <Switch
                checked={form.permissionFilesystem}
                onCheckedChange={v => void update('permissionFilesystem', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Terminal</span>
              <Switch
                checked={form.permissionTerminal}
                onCheckedChange={v => void update('permissionTerminal', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Network</span>
              <Switch
                checked={form.permissionNetwork}
                onCheckedChange={v => void update('permissionNetwork', v)}
              />
            </div>
          </div>

          {dirty && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleCancel()}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
