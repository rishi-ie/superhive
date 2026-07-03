/**
 * Agent Inbox — polished approval + question cards for the selected agent.
 */
import { useState } from 'react';
import { ShieldAlert, GitMerge, HelpCircle, ChevronRight, Send } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextInput } from '@/components/ui/TextInput';
import { BulkActionBar } from '@/components/right-auxiliary/shared/BulkActionBar';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { FilterChips } from '@/components/right-auxiliary/shared/FilterChips';
import { getAuditItems, getPendingQuestions, approveAudit, denyAudit, answerQuestion } from '@/data/agents/store';
import { addMessageToActiveThread } from '@/data/chat/store';
import { formatRelativeTime } from '@/lib/relative-time';
import { useToast } from '@/lib/toast-context';
import type { Agent } from '@/data/agents/store';
import type { AuditItem, PendingQuestion } from '@/data/agents/interface';

type AgentInboxProps = {
  agent: Agent;
  onTicketClick?: (id: string) => void;
};

type FilterId = 'all' | 'approvals' | 'questions';

/* ─── Approval Card ─────────────────────────────────────────────────────── */

type ApprovalCardProps = {
  item: AuditItem;
  selected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onDeny: () => void;
};

function ApprovalCard({ item, selected, onToggle, onApprove, onDeny }: ApprovalCardProps) {
  const isAuth = item.type === 'AUTH_INTERCEPT';

  return (
    <div
      className={`
        rounded-md border border-border bg-card p-3
        border-l-2 ${isAuth ? 'border-l-accent' : 'border-l-chart-2'}
        ${selected ? 'ring-1 ring-accent/50' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          size="sm"
          className="mt-0.5"
        />
        {isAuth ? (
          <ShieldAlert size={13} strokeWidth={STROKE_WIDTH} className="text-accent shrink-0 mt-0.5" />
        ) : (
          <GitMerge size={13} strokeWidth={STROKE_WIDTH} className="text-chart-2 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded ${
              isAuth ? 'text-accent bg-accent/10' : 'text-chart-2 bg-chart-2/10'
            }`}>
              {isAuth ? 'AUTH' : (item.prId ?? 'DIFF')}
            </span>
            {item.scope && (
              <span className="text-[9px] text-muted-foreground/80 bg-muted/60 px-1 py-0.5 rounded">
                {item.scope}
              </span>
            )}
            {item.touchedFiles != null && (
              <span className="text-[9px] text-muted-foreground/70">
                +{item.touchedFiles} files
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground/50 font-fustat">
            {formatRelativeTime(item.timestamp)}
          </div>
        </div>
      </div>

      {/* Title + description */}
      <div className="ml-5 space-y-1 mb-2.5">
        <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
          {item.title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
          {item.description}
        </p>
      </div>

      {/* Actions */}
      <div className="ml-5 flex items-center gap-1.5">
        {isAuth ? (
          <>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={onApprove}
            >
              Grant One-Time Access
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={onDeny}
            >
              Deny
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={onApprove}
            >
              View Diff
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={onApprove}
            >
              Approve & Merge
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Question Card ─────────────────────────────────────────────────────── */

type QuestionCardProps = {
  question: PendingQuestion;
  onAnswer: (text: string) => void;
};

function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onAnswer(text);
    setSent(true);
  };

  const handleOption = (opt: string) => {
    onAnswer(opt);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-md border border-border border-l-2 border-l-chart-3 bg-card p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <HelpCircle size={13} strokeWidth={STROKE_WIDTH} className="text-chart-3 shrink-0" />
          <span className="text-[9px] text-chart-3 font-semibold uppercase tracking-wider">Answered</span>
          <span className="text-[10px] text-muted-foreground/50 font-fustat ml-auto">
            {formatRelativeTime(question.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic ml-5">Your answer has been sent to the chat.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border border-l-2 border-l-chart-3 bg-card p-3">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle size={13} strokeWidth={STROKE_WIDTH} className="text-chart-3 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] text-chart-3 font-semibold uppercase tracking-wider">Question</span>
            <span className="text-[10px] text-muted-foreground/50 font-fustat">
              {formatRelativeTime(question.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Question text */}
      <div className="ml-5 mb-2.5">
        <p className="text-xs font-medium text-foreground leading-tight line-clamp-3">
          {question.question}
        </p>
      </div>

      {/* Options */}
      {question.options && question.options.length > 0 && (
        <div className="ml-5 flex flex-col gap-1 mb-2.5">
          {question.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleOption(opt)}
              className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors text-left w-full"
            >
              {opt}
              <ChevronRight size={9} strokeWidth={STROKE_WIDTH} className="ml-auto shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Text answer input */}
      <div className="ml-5 flex items-center gap-1.5">
        <TextInput
          size="sm"
          placeholder="Type your answer..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          className="flex-1 h-7 text-xs"
        />
        <Button
          variant="default"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleSend}
          disabled={!draft.trim()}
        >
          <Send size={11} strokeWidth={STROKE_WIDTH} />
        </Button>
      </div>
    </div>
  );
}

/* ─── Main AgentInbox ───────────────────────────────────────────────────── */

/**
 * Agent Inbox — approval and question cards for the selected agent.
 * @param agent - The selected agent
 * @param onTicketClick - Called when a ticket reference is clicked
 */
export function AgentInbox({ agent, onTicketClick: _onTicketClick }: AgentInboxProps) {
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<PendingQuestion[]>(() => getPendingQuestions(agent.id));
  const toast = useToast();

  const auditItems = getAuditItems(agent.id);

  const filteredAudits = filter === 'questions' ? [] : auditItems;
  const filteredQuestions = filter === 'approvals' ? [] : questions;

  const visibleCount = filteredAudits.length + filteredQuestions.length;
  const approvalCount = auditItems.length;
  const questionCount = questions.length;

  const effectiveFilterChips = [
    { id: 'all'        as FilterId, label: `All (${visibleCount})`        },
    { id: 'approvals'  as FilterId, label: `Approvals (${approvalCount})`  },
    { id: 'questions'  as FilterId, label: `Questions (${questionCount})`  },
  ];

  const toggleAudit = (id: string) => {
    setSelectedAuditIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleApprove = (id: string) => {
    approveAudit(id);
    setSelectedAuditIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast({ title: 'Approved' });
  };

  const handleDeny = (id: string) => {
    denyAudit(id);
    setSelectedAuditIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast({ title: 'Denied' });
  };

  const handleBulkApprove = () => {
    selectedAuditIds.forEach(id => approveAudit(id));
    setSelectedAuditIds(new Set());
    toast({ title: `${selectedAuditIds.size} approved` });
  };

  const handleBulkDeny = () => {
    selectedAuditIds.forEach(id => denyAudit(id));
    setSelectedAuditIds(new Set());
    toast({ title: `${selectedAuditIds.size} denied` });
  };

  const handleAnswer = (questionId: string, text: string) => {
    answerQuestion(questionId, text, agent.id);
    addMessageToActiveThread(text, agent.id);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    toast({ title: 'Answer sent to chat' });
  };

  const handleClearSelection = () => setSelectedAuditIds(new Set());

  const hasAudits = filteredAudits.length > 0;
  const hasQuestions = filteredQuestions.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="px-3 py-2 shrink-0">
        <FilterChips
          chips={effectiveFilterChips}
          selected={filter}
          onChange={id => setFilter(id as FilterId)}
        />
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-3">
        {!hasAudits && !hasQuestions ? (
          <EmptyState
            icon={<HelpCircle size={28} strokeWidth={1.5} />}
            title="All caught up"
            description="Nothing needs your attention for this agent"
          />
        ) : (
          <div className="space-y-2 py-1">
            {/* Approval cards */}
            {filteredAudits.map(item => (
              <ApprovalCard
                key={item.id}
                item={item}
                selected={selectedAuditIds.has(item.id)}
                onToggle={() => toggleAudit(item.id)}
                onApprove={() => handleApprove(item.id)}
                onDeny={() => handleDeny(item.id)}
              />
            ))}

            {/* Question cards */}
            {filteredQuestions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                onAnswer={text => handleAnswer(q.id, text)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedAuditIds.size > 0 && (
        <BulkActionBar
          count={selectedAuditIds.size}
          onClear={handleClearSelection}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleBulkDeny}
              >
                Deny {selectedAuditIds.size > 1 ? `all (${selectedAuditIds.size})` : ''}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={handleBulkApprove}
              >
                Approve {selectedAuditIds.size > 1 ? `all (${selectedAuditIds.size})` : ''}
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}