'use client';
import React from 'react';
import { cn } from '@/src/lib/utils';

export const ProgressBar = ({
  progress,
  colorClass,
  heightClass = 'h-2',
}: {
  progress: number;
  colorClass: string;
  heightClass?: string;
}) => (
  <div className={cn('w-full bg-black/50 rounded-full overflow-hidden', heightClass)}>
    <div
      className={cn('h-full rounded-full transition-all duration-500', colorClass)}
      style={{ width: `${progress}%` }}
    />
  </div>
);

export const VerticalProgressBar = ({
  progress,
  colorClass,
  label,
  sublabel,
}: {
  progress: number;
  colorClass: string;
  label: string;
  sublabel: string;
}) => (
  <div className="flex flex-col items-center justify-end gap-2 h-full">
    <div className="text-lg font-black text-white drop-shadow-md shrink-0">
      {Math.round(progress)}%
    </div>
    <div className="h-32 w-16 bg-black/50 rounded-2xl overflow-hidden relative flex flex-col justify-end shadow-inner border border-white/5">
      <div
        className={cn('w-full transition-all duration-500 rounded-b-2xl', colorClass)}
        style={{ height: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
    <div className="text-center w-20 overflow-hidden flex flex-col items-center gap-1 mt-1">
      <div
        className="text-[10px] font-bold text-white uppercase tracking-wider truncate w-full"
        title={label}
      >
        {label}
      </div>
      <div
        className={cn(
          'text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10',
          colorClass.replace('bg-', 'text-')
        )}
      >
        {sublabel}
      </div>
    </div>
  </div>
);
