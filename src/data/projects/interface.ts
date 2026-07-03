export interface ChannelMessage {
  id: string;
  channelId: string;
  content: string;
  role: string;
  createdAt: string;
}
export interface Project {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  successCriteria: string;
  color: string;
  status: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}
