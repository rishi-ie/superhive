import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SettingsSectionProps } from './registry'

const MODEL_PROVIDERS = [
  { value: 'minimax',   label: 'MiniMax' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'google',    label: 'Google' },
  { value: 'deepseek',  label: 'DeepSeek' },
]

const THINKING_LEVELS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
]

export function ModelSection({ settings, patch }: SettingsSectionProps) {
  const provider = settings.model?.provider ?? 'minimax'
  const modelName = settings.model?.name ?? ''
  const thinkingLevel = settings.runtime?.thinkingLevel ?? 'medium'

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Model Provider</Label>
        <Select value={provider} onValueChange={v => patch('model', { provider: v, name: modelName })}>
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
          value={modelName}
          onChange={e => patch('model', { provider, name: e.target.value })}
          placeholder="e.g. MiniMax-M2.7"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Thinking Level</Label>
        <Select value={thinkingLevel} onValueChange={v => patch('runtime', { ...settings.runtime, thinkingLevel: v })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THINKING_LEVELS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
