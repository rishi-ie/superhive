import { useState, useCallback } from 'react';

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 340;

export function usePanelCollapse() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const toggleLeft = useCallback(() => {
    setLeftCollapsed(v => !v);
  }, []);

  const toggleRight = useCallback(() => {
    setRightCollapsed(v => !v);
  }, []);

  const getLeftWidth = useCallback((normalWidth: number) => {
    return leftCollapsed ? 0 : normalWidth;
  }, [leftCollapsed]);

  const getRightWidth = useCallback((normalWidth: number) => {
    return rightCollapsed ? 0 : normalWidth;
  }, [rightCollapsed]);

  return {
    leftCollapsed,
    rightCollapsed,
    toggleLeft,
    toggleRight,
    getLeftWidth,
    getRightWidth,
  };
}
