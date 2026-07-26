import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

/** Settings UI contract: sidebar-scale type, compact card spacing, and token-only geometry. */
export function SettingsPage({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 px-6 pt-20 pb-8">
      <header className="flex flex-col gap-gap-tight">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}

export function SettingsPanel({
  title,
  description,
  action,
  children,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card size="sm" className="rounded-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="-mb-(--card-spacing)">
        <FieldGroup className="-mx-(--card-spacing) gap-0">{children}</FieldGroup>
      </CardContent>
      {footer ? <CardFooter className="border-t">{footer}</CardFooter> : null}
    </Card>
  );
}

export function SettingsRow({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Field orientation="horizontal" className="min-h-11 px-(--card-spacing) py-2">
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
      {children}
    </Field>
  );
}

export function SettingsDivider() {
  return <Separator className="mx-(--card-spacing) w-auto" />;
}
