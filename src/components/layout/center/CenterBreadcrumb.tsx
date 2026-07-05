import * as React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCenterBreadcrumb } from "@/flows/use-center-breadcrumb";

export function CenterBreadcrumb() {
  const segments = useCenterBreadcrumb();
  return (
    <div className="flex h-10 items-center px-4">
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            return (
              <React.Fragment key={`${i}-${seg.label}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-xs font-medium">
                      {seg.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link to={seg.href!}>{seg.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
