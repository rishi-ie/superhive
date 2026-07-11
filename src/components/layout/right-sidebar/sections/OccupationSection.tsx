import { FieldRow, ResponsibilitySlider } from "../primitives";

const MOCK_OCCUPATION = {
  taskName: "Building API integration",
  taskDescription: "Wire up the new /orders endpoint end-to-end",
  checklistDone: 2,
  checklistTotal: 4,
  responsibilityCount: 8,
};

export function OccupationSection() {
  const { taskName, taskDescription, checklistDone, checklistTotal, responsibilityCount } =
    MOCK_OCCUPATION;

  return (
    <div className="flex flex-col gap-gap-loose py-1">
      <FieldRow label="Active task">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-foreground">{taskName}</span>
          <span className="text-xs text-muted-foreground/60">
            {taskDescription}
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Checklist">
        <span className="text-sm text-foreground">
          {checklistDone} of {checklistTotal} done
        </span>
      </FieldRow>
      <div className="flex flex-col gap-gap-tight">
        <span className="text-xs text-muted-foreground">Responsibility</span>
        <ResponsibilitySlider count={responsibilityCount} caption="More responsibilities = lower health" />
      </div>
    </div>
  );
}
