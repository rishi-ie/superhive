import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import { HugeIcon } from "@/components/ui/huge-icon";
import { UserIcon } from "@phosphor-icons/react";
import { EllipsisIcon, Folder02Icon } from "@hugeicons/core-free-icons";
import { useCenterBreadcrumb } from "@/flows/ui/use-center-breadcrumb";

export function CenterBreadcrumb() {
  const location = useLocation();
  const segments = useCenterBreadcrumb();
  const isAgentChat = /^\/agents\/[^/]+$/.test(location.pathname);
  const isProjectChat = /^\/projects\/[^/]+$/.test(location.pathname);
  const isPlugins = location.pathname === '/plugins';
  if (isPlugins) return null;
  if (!segments) return null;
  if (isAgentChat || isProjectChat) {
    const title = segments.at(-1)?.label;
    return (
      <div className="flex h-12 items-center border-b border-border px-composer">
        <nav aria-label="Current chat" className="flex items-center gap-2.5 font-sans text-foreground">
          {isProjectChat ? <HugeIcon icon={Folder02Icon} size={16} className="size-4" /> : <Icon icon={UserIcon} className="size-4" />}
          <span className="max-w-[min(60vw,42rem)] truncate text-base font-medium">{title}</span>
          <button type="button" aria-label="More chat actions" className="flex size-7 cursor-default items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <HugeIcon icon={EllipsisIcon} size={16} className="size-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    );
  }
  return (
    <div className="flex items-center px-composer pb-2 pt-3">
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
