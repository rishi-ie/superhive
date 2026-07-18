import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/shell";
import { Landing } from "@/pages/landing";
import { AgentChatView, AgentsListView } from "@/pages/agent-chat";
import { ProjectChatView, ProjectsListView } from "@/pages/project-chat";
import { MetaHiveView } from "@/pages/meta-hive";
import { RemoteView } from "@/pages/remote";
import { PluginsView } from "@/pages/plugins";
import { SettingsLayout, SettingsSectionView } from "@/pages/settings";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "agents",
        children: [
          { index: true, element: <AgentsListView /> },
          { path: ":agentId", element: <AgentChatView /> },
        ],
      },
      {
        path: "projects",
        children: [
          { index: true, element: <ProjectsListView /> },
          { path: ":projectId", element: <ProjectChatView /> },
        ],
      },
      {
        path: "hive",
        element: <MetaHiveView />,
      },
      {
        path: "remote",
        element: <RemoteView />,
      },
      {
        path: "plugins",
        element: <PluginsView />,
      },
    ],
  },
  {
    path: "/settings",
    element: <SettingsLayout />,
    children: [
      { index: true, element: <Navigate to="general" replace /> },
      { path: ":section", element: <SettingsSectionView /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
