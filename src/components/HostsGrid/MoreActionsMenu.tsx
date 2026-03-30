import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Power, RotateCw, Trash2 } from 'lucide-react';

interface MoreActionsMenuProps {
  isOpen: boolean;
  selectedCount: number;
  onToggle: () => void;
  onClose: () => void;
  onShutdown: () => void;
  onRestart: () => void;
  onDelete: () => void;
}

export const MoreActionsMenu = ({
  isOpen,
  selectedCount,
  onToggle,
  onClose,
  onShutdown,
  onRestart,
  onDelete
}: MoreActionsMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Update menu position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        left: rect.left
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking on button or menu
      if (buttonRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    if (isOpen) {
      // Use click instead of mousedown to allow menu item clicks to fire first
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleShutdown = () => {
    onShutdown();
    onClose();
  };

  const handleRestart = () => {
    onRestart();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={onToggle}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 px-3 py-2 bg-background-tertiary border border-border-primary
                 hover:border-border-tertiary hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed
                 text-text-primary rounded-md text-xs font-medium
                 transition-all duration-200 ease-macos
                 shadow-macos-button
                 active:shadow-macos-button-active active:scale-[0.97] h-[34px]"
      >
        <span>More Actions</span>
        {selectedCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-macos-blue text-white text-[10px] rounded-full">
            {selectedCount}
          </span>
        )}
        <ChevronDown className="w-[10px] h-[10px] text-text-tertiary" />
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 px-3 py-2 bg-background-tertiary border border-border-primary
                 hover:border-border-tertiary hover:bg-background-hover disabled:opacity-40 disabled:cursor-not-allowed
                 text-text-primary rounded-md text-xs font-medium
                 transition-all duration-200 ease-macos
                 shadow-macos-button
                 active:shadow-macos-button-active active:scale-[0.97] h-[34px]"
      >
        <span>More Actions</span>
        {selectedCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-macos-blue text-white text-[10px] rounded-full">
            {selectedCount}
          </span>
        )}
        <ChevronDown className="w-[10px] h-[10px] text-text-tertiary rotate-180 transition-transform" />
      </button>

      {createPortal(
        <div
          ref={menuRef}
          className="fixed z-[70] bg-background-secondary/95 backdrop-blur-xl rounded-lg shadow-macos-lg border border-border-primary py-1 animate-slide-down"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: '144px'
          }}
        >
          <button
            onClick={handleShutdown}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-white hover:bg-macos-blue/20 transition-colors"
          >
            <Power className="w-[11px] h-[11px] text-macos-red" />
            <span>Shutdown</span>
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-white hover:bg-macos-blue/20 transition-colors"
          >
            <RotateCw className="w-[11px] h-[11px] text-macos-blue" />
            <span>Restart</span>
          </button>
          <div className="h-px bg-border-secondary my-1" />
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-macos-red hover:bg-macos-red/20 transition-colors"
          >
            <Trash2 className="w-[11px] h-[11px] text-macos-red" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

export default MoreActionsMenu;