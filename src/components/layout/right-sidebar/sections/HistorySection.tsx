import { SessionRow } from "../primitives";

interface PastSession {
  name: string;
  cost: number;
  timestamp: string;
}

const MOCK_SESSIONS: PastSession[] = [
  { name: "Refactor onboarding flow", cost: 0.12, timestamp: "3d ago" },
  { name: "Fix nav alignment", cost: 0.04, timestamp: "2d ago" },
  { name: "Audit settings page", cost: 0.31, timestamp: "1d ago" },
  { name: "Implement auth middleware", cost: 0.48, timestamp: "18h ago" },
  { name: "Write API integration tests", cost: 0.22, timestamp: "12h ago" },
  { name: "Tune onboarding copy", cost: 0.08, timestamp: "6h ago" },
  { name: "Update dependency manifest", cost: 0.03, timestamp: "2h ago" },
  { name: "Initial agent bootstrap", cost: 0.18, timestamp: "1w ago" },
];

export function HistorySection() {
  return (
    <div className="flex flex-col gap-gap-tight py-1">
      {MOCK_SESSIONS.map((s, i) => (
        <SessionRow key={i} name={s.name} cost={s.cost} timestamp={s.timestamp} />
      ))}
    </div>
  );
}
