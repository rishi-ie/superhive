import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import {
  Landing,
  AgentChatView,
  ProjectChatView,
  MetaHiveView,
  RemoteView,
} from "@/components/layout/center";

export const router = createBrowserRouter([
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
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
