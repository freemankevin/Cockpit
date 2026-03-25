import { useState, useRef, useCallback } from 'react';

interface Column {
  key: string;
  title: string;
  width: number;
  minWidth?: number;
  resizable?: boolean;
}

interface ResizableHeaderProps {
  columns: Column[];
  onResize: (key: string, width: number) => void;
  children: React.ReactNode;
}

export const ResizableHeader = ({ columns, onResize, children }: ResizableHeaderProps) => {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const columnKeyRef = useRef<string>('');

  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingKey(columnKey);
    columnKeyRef.current = columnKey;
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + delta);
      onResize(columnKeyRef.current, newWidth);
    };

    const handleMouseUp = () => {
      setDraggingKey(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onResize]);

  return (
    <div className="flex bg-background-tertiary border-b border-border-primary text-xs select-none">
      {columns.map((column, index) => (
        <div
          key={column.key}
          className="flex items-center relative group"
          style={{ width: column.width, minWidth: column.minWidth || 50 }}
        >
          <div className="flex-1 px-3 py-2.5 flex items-center overflow-hidden">
            {children && (children as any)[index]}
          </div>
          
          {/* Resize handle */}
          {column.resizable !== false && index < columns.length - 1 && (
            <div
              className={`absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center z-10
                ${hoverKey === column.key ? 'bg-macos-blue/10' : ''}
                ${draggingKey === column.key ? 'bg-macos-blue/20' : ''}`}
              onMouseEnter={() => setHoverKey(column.key)}
              onMouseLeave={() => setHoverKey(null)}
              onMouseDown={(e) => handleMouseDown(e, column.key, column.width)}
            >
              {/* Visual indicator line */}
              <div 
                className={`h-4 w-px transition-colors duration-150
                  ${draggingKey === column.key ? 'bg-macos-blue' : hoverKey === column.key ? 'bg-macos-blue/60' : 'bg-transparent group-hover:bg-macos-gray-2/50'}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResizableHeader;
