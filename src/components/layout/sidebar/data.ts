export type AgentStatus = "online" | "away" | "offline";

export interface MockAgent {
  id: string;
  name: string;
  status: AgentStatus;
}

export type ProjectNodeType = "folder" | "chat" | "agent";

export interface MockProjectNode {
  id: string;
  name: string;
  type: ProjectNodeType;
  defaultExpanded?: boolean;
  children?: MockProjectNode[];
}

export interface MockConversation {
  id: string;
  title: string;
}

export const mockAgents: MockAgent[] = [
  { id: "coding",   name: "Coding Agent",   status: "online"  },
  { id: "research", name: "Research Agent", status: "away"    },
  { id: "designer", name: "Designer",       status: "online"  },
  { id: "qa",       name: "QA",             status: "offline" },
];

export const mockProjects: MockProjectNode[] = [
  {
    id: "hive",
    name: "Super Hive",
    type: "folder",
    defaultExpanded: true,
    children: [
      { id: "hive-chat",      name: "Project Chat", type: "chat"   },
      { id: "hive-backend",   name: "Backend",      type: "agent"  },
      { id: "hive-ui",        name: "UI",           type: "agent"  },
      { id: "hive-research",  name: "Research",     type: "agent"  },
    ],
  },
  { id: "website", name: "Website", type: "folder" },
  { id: "mobile",  name: "Mobile",  type: "folder" },
  { id: "api",     name: "API",     type: "folder" },
];

export const mockConversations: MockConversation[] = [
  { id: "1", title: "Sidebar Redesign"    },
  { id: "2", title: "Landing Page"        },
  { id: "3", title: "Research Session"     },
  { id: "4", title: "Marketing Strategy"  },
];

export interface MockChannel {
  id: string;
  name: string;
}

export interface MockPinned {
  id: string;
  refType: "agent" | "project";
  refId: string;
  name: string;
}

export const mockChannels: MockChannel[] = [
  { id: "general",   name: "general"    },
  { id: "engineering", name: "engineering" },
  { id: "design",    name: "design"      },
  { id: "random",    name: "random"      },
];

export const mockPinned: MockPinned[] = [
  { id: "p1", refType: "agent",   refId: "coding",   name: "Coding Agent"   },
  { id: "p2", refType: "project", refId: "hive",     name: "Super Hive"     },
  { id: "p3", refType: "agent",   refId: "research", name: "Research Agent" },
];
