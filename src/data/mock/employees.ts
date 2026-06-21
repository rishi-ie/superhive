export type ActiveEmployee = {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
};

export const activeEmployees: ActiveEmployee[] = [
  {
    id: 'emp-ava',
    name: 'Ava Chen',
    avatar: undefined,
    status: 'active',
    currentTask: 'Writing onboarding flow',
  },
  {
    id: 'emp-marcus',
    name: 'Marcus Webb',
    avatar: undefined,
    status: 'busy',
    currentTask: 'Reviewing PR #142',
  },
  {
    id: 'emp-priya',
    name: 'Priya Sharma',
    avatar: undefined,
    status: 'active',
    currentTask: 'API integration',
  },
  {
    id: 'emp-james',
    name: 'James Liu',
    avatar: undefined,
    status: 'idle',
  },
  {
    id: 'emp-sonia',
    name: 'Sonia Patel',
    avatar: undefined,
    status: 'active',
    currentTask: 'Building design system',
  },
];