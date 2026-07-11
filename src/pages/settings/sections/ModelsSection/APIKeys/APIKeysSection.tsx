import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { CaretDownIcon } from '@phosphor-icons/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ProviderKeyField } from './ProviderKeyField';
import { ToggleProviderField } from './ToggleProviderField';
import { MultiToggleProviderField } from './MultiToggleProviderField';

export function APIKeysSection() {
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-3">
      <CollapsibleTrigger className="group flex items-center justify-between gap-2 cursor-default self-start">
        <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
        <Icon
          icon={CaretDownIcon}
          className={cn(
            'size-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-6">
        <ProviderKeyField
          heading="OpenAI API Key"
          description={
            <span>
              Used to authenticate OpenAI requests. Get a key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                platform.openai.com
              </a>
              .
            </span>
          }
          placeholder="Enter your OpenAI API Key"
        />

        <ToggleProviderField
          heading="Override OpenAI Base URL"
          description="Use a custom endpoint for OpenAI-compatible providers."
          inputPlaceholder="https://api.openai.com/v1"
          defaultEnabled={true}
        />

        <ProviderKeyField
          heading="Anthropic API Key"
          description={
            <span>
              Used to authenticate Anthropic requests. Requests are sent via{' '}
              <a
                href="https://anthropic.com"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                anthropic.com
              </a>
              .
            </span>
          }
          placeholder="Enter your Anthropic API Key"
        />

        <ProviderKeyField
          heading="Google API Key"
          description={
            <span>
              Used to authenticate Google AI Studio requests. Get a key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                aistudio.google.com
              </a>
              .
            </span>
          }
          placeholder="Enter your Google AI Studio API Key"
        />

        <MultiToggleProviderField
          heading="Azure OpenAI"
          description="Route OpenAI-compatible requests through Microsoft Azure."
          defaultEnabled={false}
          rows={[
            {
              id: 'baseUrl',
              label: 'Base URL',
              placeholder: 'https://YOUR-RESOURCE.openai.azure.com',
            },
            {
              id: 'deployment',
              label: 'Deployment Name',
              placeholder: 'YOUR-DEPLOYMENT',
            },
            {
              id: 'apiKey',
              label: 'API Key',
              placeholder: 'Enter Azure API Key',
              secret: true,
            },
          ]}
        />

        <MultiToggleProviderField
          heading="AWS Bedrock"
          description={
            <span>
              Route requests through Amazon Bedrock.
              <br />
              Requires AWS credentials with Bedrock access on the host.
            </span>
          }
          defaultEnabled={false}
          rows={[
            {
              id: 'accessKeyId',
              label: 'Access Key ID',
              placeholder: 'AKIA…',
            },
            {
              id: 'secretAccessKey',
              label: 'Secret Access Key',
              placeholder: 'Enter Secret Access Key',
              secret: true,
            },
            {
              id: 'region',
              label: 'Region',
              placeholder: 'us-east-1',
            },
            {
              id: 'testModel',
              label: 'Test Model',
              placeholder: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            },
          ]}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
