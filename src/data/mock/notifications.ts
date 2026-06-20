export type Notification = {
  id: string;
  type: 'mention' | 'task' | 'system' | 'update';
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: 'n-1',
    type: 'mention',
    title: 'Ava Chen mentioned you',
    description: 'in #design-system: "Hey @you, can you review the new color tokens?"',
    time: '2m ago',
    read: false,
  },
  {
    id: 'n-2',
    type: 'task',
    title: 'Task assigned to you',
    description: '"Review authentication flow" was assigned by Marcus Webb',
    time: '15m ago',
    read: false,
  },
  {
    id: 'n-3',
    type: 'update',
    title: 'Superhive v2.4 deployed',
    description: 'Successfully deployed to production. 3 new features, 12 fixes.',
    time: '1h ago',
    read: true,
  },
  {
    id: 'n-4',
    type: 'system',
    title: 'Weekly digest ready',
    description: 'Your team completed 47 tasks this week. View summary.',
    time: '3h ago',
    read: true,
  },
  {
    id: 'n-5',
    type: 'mention',
    title: 'James Liu mentioned you',
    description: 'in #frontend: "The new breadcrumb component looks great!"',
    time: '5h ago',
    read: true,
  },
];
