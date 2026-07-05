import type { MockProjectNode } from "./data";
import { ProjectTreeItem } from "./ProjectTreeItem";

interface ProjectTreeProps {
  nodes: MockProjectNode[];
  depth?: number;
}

export function ProjectTree({ nodes, depth = 0 }: ProjectTreeProps) {
  return (
    <>
      {nodes.map((node) => (
        <ProjectTreeItem key={node.id} node={node} depth={depth} />
      ))}
    </>
  );
}
