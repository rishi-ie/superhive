import { FieldRow } from "../primitives/FieldRow";

const MOCK_CONTEXT = {
  name: "Coding assistant",
  description: "Autonomous coding agent that reviews pull requests, writes tests, and refactors legacy modules.",
  model: "Claude 3.5 Sonnet",
  provider: "Anthropic",
  prompt: "You are a careful, thorough coding assistant. Always read the existing code before suggesting changes. Prefer small, focused diffs. Run tests after every change. Ask clarifying questions when requirements are ambiguous. Never modify files outside the project directory.",
};

export function ContextSection() {
  return (
    <div className="flex flex-col gap-gap-loose py-1">
      <FieldRow label="Name">
        <span className="text-sm text-foreground">{MOCK_CONTEXT.name}</span>
      </FieldRow>
      <FieldRow label="Description">
        <span className="text-sm text-foreground">{MOCK_CONTEXT.description}</span>
      </FieldRow>
      <FieldRow label="Model">
        <span className="text-sm text-foreground">
          {MOCK_CONTEXT.model} · {MOCK_CONTEXT.provider}
        </span>
      </FieldRow>
      <FieldRow label="Prompt">
        <span className="text-sm text-foreground line-clamp-3">
          {MOCK_CONTEXT.prompt}
        </span>
      </FieldRow>
    </div>
  );
}
