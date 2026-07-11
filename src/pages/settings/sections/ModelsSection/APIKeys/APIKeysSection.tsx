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
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-gap-loose">
      <CollapsibleTrigger className="group flex items-center justify-between gap-stack cursor-default self-start">
        <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
        <Icon
          icon={CaretDownIcon}
          className={cn(
            'size-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-gap-loose">
        <APIKeysBlocks />
      </CollapsibleContent>
    </Collapsible>
  );
}

function APIKeysBlocks() {
  const { providers, refresh } = useProviders();

  return (
    <div className="flex flex-col gap-gap-loose">
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
