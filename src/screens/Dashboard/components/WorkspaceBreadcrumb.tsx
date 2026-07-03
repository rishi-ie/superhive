import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function WorkspaceBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs text-muted-foreground">
        <BreadcrumbItem>
          <BreadcrumbLink className="flex items-center gap-1 text-muted-foreground hover:text-foreground/80">
            <Home className="size-3" />
            <span>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="size-3" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-foreground/80">Local</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
