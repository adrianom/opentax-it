import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Small info icon with a tooltip; content can include links to official sources. */
export function HelpTip({ children, label = 'Informazioni', className }: { children: ReactNode; label?: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" aria-label={label} className={cn('inline-flex align-middle text-muted-foreground hover:text-foreground', className)} />}
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1 text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}
