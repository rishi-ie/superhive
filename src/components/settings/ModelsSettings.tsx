/**
 * Models settings — browse verified providers, connect API keys, manage custom providers.
 * Three sections: Verified catalog, My providers, Add custom.
 */
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Cpu,
  Sparkles,
  Globe,
  Zap,
} from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { SettingSection } from './shared/SettingSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/TextInput';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/toasts/context';
import type { ModelProviderConfig } from '@/data/settings/interface';

/* ─── Catalog definitions ──────────────────────────────────────────────────── */

type CatalogProvider = {
  id: string;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  defaultBaseUrl: string;
  suggestedModels: string[];
};

const VERIFIED_CATALOG: CatalogProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    tagline: 'GPT-4o, o1, o3, o4',
    icon: <Sparkles size={20} strokeWidth={STROKE_WIDTH} className="text-[#10A37F]" />,
    defaultBaseUrl: 'https://api.openai.com/v1',
    suggestedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-4-turbo'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    tagline: 'Claude Opus 4.8, Sonnet 4, Haiku',
    icon: <Cpu size={20} strokeWidth={STROKE_WIDTH} className="text-[#D4A373]" />,
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    suggestedModels: ['claude-opus-4-8', 'claude-sonnet-4', 'claude-3-5-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'google',
    label: 'Google AI',
    tagline: 'Gemini 2.5, 2.0, 1.5',
    icon: <Globe size={20} strokeWidth={STROKE_WIDTH} className="text-[#4285F4]" />,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    suggestedModels: ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
];

/* ─── Provider Sheet (edit form) ─────────────────────────────────────────── */

type ProviderSheetProps = {
  provider: ModelProviderConfig | null;
  catalogEntry?: CatalogProvider;
  open: boolean;
  onClose: () => void;
  onSave: (provider: ModelProviderConfig) => void;
  onDelete?: (id: string) => void;
};

function ProviderSheet({ provider, catalogEntry, open, onClose, onSave, onDelete }: ProviderSheetProps) {
  const [label, setLabel] = useState(provider?.label ?? catalogEntry?.label ?? '');
  const [apiKey, setApiKey] = useState(provider?.apiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? catalogEntry?.defaultBaseUrl ?? '');
  const [models, setModels] = useState<string[]>(provider?.models ?? catalogEntry?.suggestedModels ?? []);
  const [modelInput, setModelInput] = useState('');

  const isConnected = apiKey.trim().length > 0;
  const isCustom = provider?.isCustom ?? false;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
    }
  };

  const handleSave = () => {
    const saved: ModelProviderConfig = {
      id: provider?.id ?? `custom-${Date.now()}`,
      label: label.trim() || catalogEntry?.label || 'Custom Provider',
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      models,
      isCustom,
      catalogId: provider?.catalogId ?? catalogEntry?.id,
      createdAt: provider?.createdAt ?? new Date().toISOString(),
    };
    onSave(saved);
    onClose();
  };

  const addModel = () => {
    const trimmed = modelInput.trim();
    if (trimmed && !models.includes(trimmed)) {
      setModels([...models, trimmed]);
    }
    setModelInput('');
  };

  const removeModel = (model: string) => {
    setModels(models.filter(m => m !== model));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] max-w-full flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>{catalogEntry ? catalogEntry.label : label}</SheetTitle>
          <SheetDescription>
            {isConnected
              ? `Connected — ${models.length} model${models.length !== 1 ? 's' : ''} configured.`
              : 'Enter your API credentials to connect.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="active" className="gap-1">
                <CheckCircle2 size={10} strokeWidth={STROKE_WIDTH} />
                Connected
              </Badge>
            ) : (
              <Badge className="gap-1 bg-muted text-muted-foreground">
                <XCircle size={10} strokeWidth={STROKE_WIDTH} />
                Not connected
              </Badge>
            )}
          </div>

          {/* Provider name (custom only) */}
          {isCustom && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Provider name</label>
              <TextInput
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="My Custom Provider"
              />
            </div>
          )}

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">API Key</label>
            <div className="relative">
              <TextInput
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Base URL
              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(optional override)</span>
            </label>
            <TextInput
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder={catalogEntry?.defaultBaseUrl ?? 'https://api.example.com/v1'}
            />
            {catalogEntry && !baseUrl && (
              <p className="text-[10px] text-muted-foreground">
                Default: <span className="font-mono">{catalogEntry.defaultBaseUrl}</span>
              </p>
            )}
          </div>

          {/* Models */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">
              Models
              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(add model IDs the provider serves)</span>
            </label>

            {/* Existing chips */}
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {models.map(model => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground font-medium"
                  >
                    {model}
                    <button
                      type="button"
                      onClick={() => removeModel(model)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <XCircle size={11} strokeWidth={STROKE_WIDTH} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add model input */}
            <div className="flex gap-1.5">
              <TextInput
                value={modelInput}
                onChange={e => setModelInput(e.target.value)}
                placeholder="e.g. gpt-4o, claude-opus-4-8"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addModel();
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addModel}
                disabled={!modelInput.trim()}
                className="shrink-0 h-9 px-3"
              >
                <Plus size={13} strokeWidth={STROKE_WIDTH} />
              </Button>
            </div>

            {/* Suggested models (when empty and catalog entry exists) */}
            {models.length === 0 && catalogEntry && (
              <div className="flex flex-wrap gap-1.5">
                {catalogEntry.suggestedModels.slice(0, 4).map(model => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setModels([model])}
                    className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-dashed border-muted-foreground/30"
                  >
                    + {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border/40 pt-4 flex items-center justify-between gap-3">
          <div>
            {isCustom && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(provider!.id);
                  onClose();
                }}
                className="text-chart-5 hover:text-chart-5 h-8 px-2"
              >
                <Trash2 size={13} strokeWidth={STROKE_WIDTH} className="mr-1" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave}>
              {isConnected ? 'Save changes' : 'Connect'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Verified provider card ──────────────────────────────────────────────── */

type CatalogCardProps = {
  catalog: CatalogProvider;
  isConnected: boolean;
  onAdd: () => void;
  onEdit: () => void;
};

function CatalogCard({ catalog, isConnected, onAdd, onEdit }: CatalogCardProps) {
  return (
    <Card className="bg-card hover:border-border/80 transition-colors">
      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[130px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 shrink-0 rounded-md bg-muted flex items-center justify-center">
              {catalog.icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-foreground">{catalog.label}</span>
              <span className="text-[10px] text-muted-foreground">{catalog.tagline}</span>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="active" className="text-[9px] shrink-0">
              <CheckCircle2 size={9} strokeWidth={STROKE_WIDTH} />
              Connected
            </Badge>
          ) : (
            <span className="w-[56px]" />
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {isConnected ? (
            <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-[11px] gap-1">
              <Pencil size={11} strokeWidth={STROKE_WIDTH} />
              Edit
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={onAdd} className="h-7 text-[11px] gap-1">
              <Plus size={11} strokeWidth={STROKE_WIDTH} />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── My providers list item ──────────────────────────────────────────────── */

type MyProviderRowProps = {
  provider: ModelProviderConfig;
  onEdit: () => void;
  onDisconnect: () => void;
};

function MyProviderRow({ provider, onEdit, onDisconnect }: MyProviderRowProps) {
  const catalog = VERIFIED_CATALOG.find(c => c.id === provider.catalogId);
  const icon = catalog?.icon ?? <Cpu size={15} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />;

  return (
    <Card className="bg-card">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="size-8 shrink-0 rounded-md bg-muted flex items-center justify-center">
          {icon}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">{provider.label}</span>
          <span className="text-[10px] text-muted-foreground truncate">
            {provider.baseUrl || catalog?.defaultBaseUrl || '—'}
            {provider.models.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/60">
                · {provider.models.slice(0, 3).join(', ')}
                {provider.models.length > 3 && ` +${provider.models.length - 3}`}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="active" className="text-[9px]">
            <CheckCircle2 size={9} strokeWidth={STROKE_WIDTH} />
            Connected
          </Badge>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
            <Pencil size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-chart-5"
          >
            <Trash2 size={12} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Add custom provider dialog ─────────────────────────────────────────── */

type AddCustomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (provider: ModelProviderConfig) => void;
};

function AddCustomDialog({ open, onOpenChange, onAdd }: AddCustomDialogProps) {
  const [label, setLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState<string[]>([]);

  const addModel = () => {
    const trimmed = modelInput.trim();
    if (trimmed && !models.includes(trimmed)) {
      setModels([...models, trimmed]);
    }
    setModelInput('');
  };

  const removeModel = (m: string) => setModels(models.filter(x => x !== m));

  const handleSubmit = () => {
    if (!label.trim() || !apiKey.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      label: label.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      models,
      isCustom: true,
      createdAt: new Date().toISOString(),
    });
    setLabel('');
    setApiKey('');
    setBaseUrl('');
    setModels([]);
    setModelInput('');
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setLabel('');
      setApiKey('');
      setBaseUrl('');
      setModels([]);
      setModelInput('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add custom provider</DialogTitle>
          <DialogDescription>
            Connect any OpenAI-compatible API endpoint. Add your own model IDs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Provider name</label>
            <TextInput
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Groq, Mistral, Ollama"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Base URL</label>
            <TextInput
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">API Key</label>
            <div className="relative">
              <TextInput
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground">Models</label>
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {models.map(m => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground font-medium">
                    {m}
                    <button type="button" onClick={() => removeModel(m)} className="text-muted-foreground hover:text-foreground">
                      <XCircle size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <TextInput
                value={modelInput}
                onChange={e => setModelInput(e.target.value)}
                placeholder="Model ID — Enter to add"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addModel();
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addModel} disabled={!modelInput.trim()} className="shrink-0 h-9 px-3">
                <Plus size={13} />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!label.trim() || !apiKey.trim()}
          >
            Add provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export function ModelsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();

  const [sheetProvider, setSheetProvider] = useState<ModelProviderConfig | null>(null);
  const [sheetCatalog, setSheetCatalog] = useState<CatalogProvider | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addCustomOpen, setAddCustomOpen] = useState(false);

  const providers = settings.models.providers;

  const connectedProviders = providers.filter(p => p.apiKey.trim().length > 0);

  const isCatalogConnected = (catalogId: string) =>
    providers.some(p => p.catalogId === catalogId && p.apiKey.trim().length > 0);

  const getCatalogProvider = (catalogId: string) =>
    providers.find(p => p.catalogId === catalogId && p.apiKey.trim().length > 0) ?? null;

  const openSheetForCatalog = (catalog: CatalogProvider) => {
    const existing = getCatalogProvider(catalog.id);
    if (existing) {
      setSheetProvider(existing);
    } else {
      setSheetProvider(null);
    }
    setSheetCatalog(catalog);
    setSheetOpen(true);
  };

  const openSheetForProvider = (provider: ModelProviderConfig) => {
    setSheetProvider(provider);
    setSheetCatalog(VERIFIED_CATALOG.find(c => c.id === provider.catalogId));
    setSheetOpen(true);
  };

  const handleSaveProvider = (saved: ModelProviderConfig) => {
    const existing = providers.findIndex(p => p.id === saved.id);
    if (existing >= 0) {
      const next = [...providers];
      next[existing] = saved;
      update('models', { providers: next });
      toast({ title: `${saved.label} updated` });
    } else {
      update('models', { providers: [...providers, saved] });
      toast({ title: `${saved.label} connected` });
    }
  };

  const handleDisconnect = (provider: ModelProviderConfig) => {
    const next = providers.map(p =>
      p.id === provider.id ? { ...p, apiKey: '', models: [] } : p
    );
    update('models', { providers: next });
    toast({ title: `${provider.label} disconnected` });
  };

  const handleDeleteProvider = (id: string) => {
    update('models', { providers: providers.filter(p => p.id !== id) });
    toast({ title: 'Provider removed' });
  };

  const handleAddCustom = (provider: ModelProviderConfig) => {
    update('models', { providers: [...providers, provider] });
    toast({ title: `${provider.label} added` });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Models"
        description="Add any model provider. Connect with your own API key."
      />

      {/* Verified providers catalog */}
      <SettingSection
        title="Verified providers"
        description="Browse our catalog of supported providers."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VERIFIED_CATALOG.map(catalog => (
            <CatalogCard
              key={catalog.id}
              catalog={catalog}
              isConnected={isCatalogConnected(catalog.id)}
              onAdd={() => openSheetForCatalog(catalog)}
              onEdit={() => openSheetForCatalog(catalog)}
            />
          ))}
        </div>
      </SettingSection>

      {/* My providers */}
      <SettingSection
        title="My providers"
        description={connectedProviders.length === 0 ? 'No providers connected yet.' : `${connectedProviders.length} provider${connectedProviders.length !== 1 ? 's' : ''} connected.`}
      >
        {connectedProviders.length === 0 ? (
          <Card className="bg-card border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                <Zap size={18} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No providers connected</p>
              <p className="text-xs text-muted-foreground max-w-48">
                Add a verified provider or create a custom provider to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {connectedProviders.map(provider => (
              <MyProviderRow
                key={provider.id}
                provider={provider}
                onEdit={() => openSheetForProvider(provider)}
                onDisconnect={() => handleDisconnect(provider)}
              />
            ))}
          </div>
        )}

        {/* Add custom provider */}
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddCustomOpen(true)}
            className="gap-1.5 h-8 text-[11px] border-dashed"
          >
            <Plus size={12} strokeWidth={STROKE_WIDTH} />
            Add custom provider
          </Button>
        </div>
      </SettingSection>

      {/* Provider edit sheet */}
      <ProviderSheet
        provider={sheetProvider}
        catalogEntry={sheetCatalog}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetProvider(null);
          setSheetCatalog(undefined);
        }}
        onSave={handleSaveProvider}
        onDelete={sheetProvider?.isCustom ? handleDeleteProvider : undefined}
      />

      {/* Add custom dialog */}
      <AddCustomDialog open={addCustomOpen} onOpenChange={setAddCustomOpen} onAdd={handleAddCustom} />
    </div>
  );
}
