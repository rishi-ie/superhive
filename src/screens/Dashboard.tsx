import { useState } from 'react';
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 280;
const MIN_LEFT_WIDTH = 180;
const MAX_LEFT_WIDTH = 400;
const MIN_RIGHT_WIDTH = 200;
const MAX_RIGHT_WIDTH = 500;

export function Dashboard() {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);

  const handleLeftWidthChange = (width: number) => {
    setLeftWidth(Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, width)));
  };

  const handleRightWidthChange = (width: number) => {
    setRightWidth(Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, width)));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav width={leftWidth} onWidthChange={handleLeftWidthChange} />
      <CenterWorkspace />
      <RightAuxiliary width={rightWidth} onWidthChange={handleRightWidthChange} />
    </div>
  );
}
