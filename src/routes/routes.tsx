import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { AgentView } from "@/screens/AgentView";
import { ProjectView } from "@/screens/ProjectView";
import { MetaHiveView } from "@/screens/MetaHiveView";
import { RemoteView } from "@/screens/RemoteView";
import { Settings } from "@/screens/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/agents" replace />,
      },
      {
        path: "agents",
        element: <AgentView />,
      },
      {
        path: "projects",
        element: <ProjectView />,
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
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
