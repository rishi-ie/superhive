import type { ChatThread } from './interface';

const mockThreads: ChatThread[] = [
  {
    id: 'thread-1',
    title: 'Superhive onboarding flow',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Build a landing page for Superhive that highlights the multi-model AI workspace concept.', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
      { id: 'msg-2', role: 'assistant', content: "I've created a modern landing page design for Superhive. The layout features a hero section with the headline 'Your Workforce, Amplified' and a three-column feature grid showcasing multi-model AI, real-time collaboration, and project management. The color scheme uses your terracotta accent (#e07850) against the dark warm palette. Want me to implement this in code?", timestamp: new Date(Date.now() - 1000 * 60 * 44) },
      { id: 'msg-3', role: 'user', content: 'Yes, please implement the hero section with responsive layout.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: 'msg-4', role: 'assistant', content: "I've implemented the hero section with a full-width layout, gradient background, and responsive grid. The hero includes your main headline, subheadline, and two CTA buttons. It adapts from single-column on mobile to a two-column layout on desktop.", timestamp: new Date(Date.now() - 1000 * 60 * 28) },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 28),
  },
  {
    id: 'thread-2',
    title: 'Mumbrane webhook architecture',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Design the webhook retry logic for Mumbrane. We need exponential backoff with jitter and dead-letter queue handling.', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
      { id: 'msg-2', role: 'assistant', content: "Here's my proposed architecture: each webhook endpoint gets its own retry queue backed by Redis. On failure, we schedule retry with exponential backoff (base: 1s, max: 5min, jitter ±20%). After 5 failures, the event goes to a DLQ. Want me to generate the core implementation?", timestamp: new Date(Date.now() - 1000 * 60 * 118) },
      { id: 'msg-3', role: 'user', content: 'Yes, and also add alerting when events hit the DLQ.', timestamp: new Date(Date.now() - 1000 * 60 * 110) },
      { id: 'msg-4', role: 'assistant', content: 'Done. The DLQ handler now fires a PagerDuty alert via webhook whenever an event lands in the dead-letter queue. Retry count, last error, and timestamp are included in the alert payload. DLQ events also trigger a Slack notification to #alerts.', timestamp: new Date(Date.now() - 1000 * 60 * 105) },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 105),
  },
  {
    id: 'thread-3',
    title: 'Sidharda SEO audit',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Run a quick SEO audit on the Sidharda website and fix the top 3 issues.', timestamp: new Date(Date.now() - 1000 * 60 * 90) },
      { id: 'msg-2', role: 'assistant', content: "I've scanned the site. Top 3 issues: (1) Missing canonical URLs on /blog/* pages, causing duplicate content flags. (2) Hero images lack alt text — affecting accessibility and image search. (3) h1 hierarchy violations on landing page (two h1s). Should I fix all three?", timestamp: new Date(Date.now() - 1000 * 60 * 88) },
      { id: 'msg-3', role: 'user', content: 'Fix all three, then give me a summary.', timestamp: new Date(Date.now() - 1000 * 60 * 85) },
      { id: 'msg-4', role: 'assistant', content: 'All three fixed. Added canonical meta tags to all /blog/* routes, added descriptive alt text to all hero images, and consolidated the duplicate h1s into proper h1 + h2 hierarchy. The SEO score should improve from 68 → ~84 based on these changes.', timestamp: new Date(Date.now() - 1000 * 60 * 80) },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 80),
  },
  {
    id: 'thread-4',
    title: 'Personal dashboard wireframe review',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Review the wireframe for the personal project dashboard. Does the layout make sense for tracking multiple side projects?', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
      { id: 'msg-2', role: 'assistant', content: "The layout is solid. A few suggestions: (1) Move the 'Recent Activity' feed above the kanban board — it's higher-value context. (2) Add a status summary bar at the top (X tasks in progress, Y done, Z blocked). (3) Consider grouping tickets by project within the kanban view since this is multi-project.", timestamp: new Date(Date.now() - 1000 * 60 * 58) },
      { id: 'msg-3', role: 'user', content: 'Great feedback. Can you update the wireframe with those changes?', timestamp: new Date(Date.now() - 1000 * 60 * 55) },
      { id: 'msg-4', role: 'assistant', content: "Updated. The new layout has the summary bar at top, activity feed as the primary section, and the kanban now supports project-grouped columns. I've attached the Figma link in the project notes.", timestamp: new Date(Date.now() - 1000 * 60 * 50) },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 50),
  },
];

export { mockThreads };
