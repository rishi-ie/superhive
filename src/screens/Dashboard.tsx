import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';

type DashboardProps = {
  leftWidth: number;
  rightWidth: number;
  onLeftWidthChange: (width: number) => void;
  onRightWidthChange: (width: number) => void;
  onNavigate: (page: Page) => void;
};

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        onSettingsClick={() => onNavigate('settings')}
      />
      <CenterWorkspace />
      <RightAuxiliary width={rightWidth} onWidthChange={onRightWidthChange} />
    </div>
  );
}
