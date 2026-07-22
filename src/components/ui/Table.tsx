import React from 'react';
import { cn } from '../../lib/cn';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-md border border-border">
      <table ref={ref} className={cn("w-full caption-bottom text-sm tabular-nums text-primary", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b border-border bg-surface-0", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 bg-surface-1", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b border-border transition-colors hover:bg-surface-2 data-[state=selected]:bg-surface-2", className)} {...props} />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-medium text-secondary", className)} {...props} />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

const ResizableTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, style, ...props }, ref) => {
    const [width, setWidth] = React.useState<number | 'auto'>('auto');
    const startX = React.useRef(0);
    const startWidth = React.useRef(0);

    const onMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      startX.current = e.clientX;
      const th = (e.target as HTMLElement).closest('th');
      startWidth.current = th?.getBoundingClientRect().width || 0;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(50, startWidth.current + (e.clientX - startX.current));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    return (
      <th 
        ref={ref} 
        style={{ ...style, width, minWidth: width !== 'auto' ? width : undefined, maxWidth: width !== 'auto' ? width : undefined }} 
        className={cn("h-10 px-4 text-left align-middle font-medium text-secondary relative group/th whitespace-nowrap", className)} 
        {...props}
      >
        {children}
        <div 
          onMouseDown={onMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/50 active:bg-accent z-10 opacity-0 group-hover/th:opacity-100 transition-opacity"
        />
      </th>
    );
  }
);
ResizableTableHead.displayName = "ResizableTableHead";


export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  ResizableTableHead,
  TableRow,
  TableCell,
};
