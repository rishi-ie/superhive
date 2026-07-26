import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CaretDownIcon } from '@phosphor-icons/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ProviderKeyBlock } from './ProviderKeyBlock';
import { useProviders } from '@/flows/settings';
import { SettingsPanel } from '../../../SettingsPrimitives';

type BlockSpec = {
  name: string;
  heading: string;
  shape: 'single' | 'aws';
  showBaseUrl: boolean;
  baseUrlPlaceholder: string;
  docsUrl: string;
};

const BLOCKS: BlockSpec[] = [
  {
    name: 'openai',
    heading: 'OpenAI',
    shape: 'single',
    showBaseUrl: true,
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'anthropic',
    heading: 'Anthropic',
    shape: 'single',
    showBaseUrl: true,
    baseUrlPlaceholder: 'https://api.anthropic.com',
    docsUrl: 'https://anthropic.com',
  },
  // V1: commented out — re-enable once thoroughly tested.
  // {
  //   name: 'google',
  //   heading: 'Gemini',
  //   shape: 'single',
  //   showBaseUrl: true,
  //   baseUrlPlaceholder: 'https://generativelanguage.googleapis.com/v1beta',
  //   docsUrl: 'https://aistudio.google.com/apikey',
  // },
  // {
  //   name: 'azure',
  //   heading: 'Azure OpenAI',
  //   shape: 'single',
  //   showBaseUrl: true,
  //   baseUrlPlaceholder: 'https://YOUR-RESOURCE.openai.azure.com',
  //   docsUrl: '',
  // },
  // {
  //   name: 'aws',
  //   heading: 'AWS Bedrock',
  //   shape: 'aws',
  //   showBaseUrl: false,
  //   baseUrlPlaceholder: '',
  //   docsUrl: '',
  // },
];

export function APIKeysSection() {
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SettingsPanel
        title="API Keys"
        description="Manage the providers available to your models."
        action={
          <CollapsibleTrigger className="flex size-7 items-center justify-center rounded-button text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Icon
              icon={CaretDownIcon}
              className={cn('transition-transform', open && 'rotate-180')}
            />
            <span className="sr-only">Toggle API keys</span>
          </CollapsibleTrigger>
        }
      >
        <CollapsibleContent className="flex flex-col gap-4 px-(--card-spacing) pb-(--card-spacing)">
          <APIKeysBlocks />
        </CollapsibleContent>
      </SettingsPanel>
    </Collapsible>
  );
}

function APIKeysBlocks() {
  const { providers, refresh } = useProviders();

  return (
    <div className="flex flex-col gap-4">
      {BLOCKS.map((b) => (
        <ProviderKeyBlock
          key={b.name}
          providerName={b.name}
          heading={b.heading}
          shape={b.shape}
          showBaseUrl={b.showBaseUrl}
          baseUrlPlaceholder={b.baseUrlPlaceholder}
          docsUrl={b.docsUrl}
          existingProvider={providers[b.name]}
          onSaved={refresh}
        />
      ))}
    </div>
  );
}
