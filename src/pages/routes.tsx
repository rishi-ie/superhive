import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/shell";
import { Landing } from "@/pages/landing";
import { AgentChatView } from "@/pages/agent-chat";
import { ProjectChatView } from "@/pages/project-chat";
import { MetaHiveView } from "@/pages/meta-hive";
import { RemoteView } from "@/pages/remote";
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
          { index: true, element: <AgentChatView /> },
          { path: ":agentId", element: <AgentChatView /> },
        ],
      },
      {
        path: "projects",
        children: [
          { index: true, element: <ProjectChatView /> },
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
