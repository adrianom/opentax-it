import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Small info icon with a tooltip; content can include links to official sources. */
export function HelpTip({ children, label = 'Informazioni' }: { children: ReactNode; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" aria-label={label} className="inline-flex text-muted-foreground hover:text-foreground" />}
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1 text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}
