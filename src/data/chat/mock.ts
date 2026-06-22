import type { ChatThread } from './interface';

const mockThreads: ChatThread[] = [
  {
    id: 'thread-1',
    title: 'Superhive onboarding flow',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Build a landing page for Superhive that highlights the multi-model AI workspace concept.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: "I've created a modern landing page design for Superhive. The layout features a hero section with the headline 'Your Workforce, Amplified' and a three-column feature grid showcasing multi-model AI, real-time collaboration, and project management. The color scheme uses your terracotta accent (#e07850) against the dark warm palette. Want me to implement this in code?",
        timestamp: new Date(Date.now() - 1000 * 60 * 44),
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Yes, please implement the hero section with responsive layout.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: "I've implemented the hero section with a full-width layout, gradient background, and responsive grid. The hero includes your main headline, subheadline, and two CTA buttons. It adapts from single-column on mobile to a two-column layout on desktop. The section uses CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` for natural responsiveness.",
        timestamp: new Date(Date.now() - 1000 * 60 * 28),
      },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 28),
  },
];

export { mockThreads };
