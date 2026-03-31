'use client';
import React from 'react';
import { cn } from '@/src/lib/utils';

export const Card = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    className={cn('bg-ese-gray/40 backdrop-blur-md border border-white/10 rounded-2xl p-4', className)}
    onClick={onClick}
  >
    {children}
  </div>
);
