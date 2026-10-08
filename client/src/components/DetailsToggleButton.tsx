import React from 'react';
import { Info } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { cn } from '../utils/cn';

interface DetailsToggleButtonProps {
  className?: string;
}

/**
 * DetailsToggleButton — Google Drive Style Headline Information Toggle
 * Positioned in the headline place of the content workspace island.
 * Highlights with light blue fill when active (#C2E7FF) and toggles the DetailsPanel.
 */
export const DetailsToggleButton: React.FC<DetailsToggleButtonProps> = ({ className = '' }) => {
  const isDetailsPanelOpen = useUIStore((state) => state.isDetailsPanelOpen);
  const toggleDetailsPanel = useUIStore((state) => state.toggleDetailsPanel);

  return (
    <button
      type="button"
      onClick={toggleDetailsPanel}
      aria-label="Toggle details panel"
      title={isDetailsPanelOpen ? 'Hide details' : 'View details (Info)'}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95',
        isDetailsPanelOpen
          ? 'bg-[#C2E7FF] text-[#001D35] ring-2 ring-[#0B57D0]/30 font-bold'
          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80',
        className
      )}
    >
      <Info className="w-4 h-4 stroke-[2.2]" />
    </button>
  );
};

export default DetailsToggleButton;
