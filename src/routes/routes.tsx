import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Dashboard } from "@/screens/Dashboard";
import { ProjectView, ProjectChatView } from "@/screens/ProjectView";
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
        element: <Dashboard />,
      },
      {
        path: "projects",
        children: [
          { index: true, element: <ProjectView /> },
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
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
