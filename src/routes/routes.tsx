import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Dashboard } from "@/pages/Dashboard";
import { ProjectView, ProjectChatView } from "@/pages/Projects";
import { MetaHiveView } from "@/pages/MetaHive";
import { RemoteView } from "@/pages/Remote";
import { Settings } from "@/pages/Settings";

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
