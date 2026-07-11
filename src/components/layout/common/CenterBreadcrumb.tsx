import * as React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCenterBreadcrumb } from "@/flows/ui/use-center-breadcrumb";

export function CenterBreadcrumb() {
  const segments = useCenterBreadcrumb();
  if (!segments) return null;
  return (
    <div className="flex items-center px-composer pt-3 pb-2">
      <Breadcrumb className="flex-1 font-sans">
        <BreadcrumbList>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            return (
              <React.Fragment key={`${i}-${seg.label}`}>
                <BreadcrumbItem>
                  {isLast || seg.clickable === false ? (
                    <BreadcrumbPage className="text-sm font-medium text-muted-foreground">
                      {seg.label}
                    </BreadcrumbPage>
                  ) : (
                    <Link to={seg.href!} className="text-sm text-muted-foreground transition-colors hover:text-foreground/80">
                      {seg.label}
                    </Link>
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
