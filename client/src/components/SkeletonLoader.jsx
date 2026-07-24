import React from 'react';

export function CardSkeleton() {
  return (
    <div className="mira-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 mira-skeleton"></div>
          <div className="h-3 w-56 mira-skeleton"></div>
        </div>
        <div className="h-6 w-16 mira-skeleton rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 bg-black/20 rounded-xl">
        <div className="space-y-1">
          <div className="h-3 w-16 mira-skeleton"></div>
          <div className="h-4 w-24 mira-skeleton"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 mira-skeleton"></div>
          <div className="h-4 w-20 mira-skeleton"></div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-9 flex-1 mira-skeleton rounded-lg"></div>
        <div className="h-9 w-24 mira-skeleton rounded-lg"></div>
        <div className="h-9 w-10 mira-skeleton rounded-lg"></div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="mira-glass p-6 space-y-4 border-l-4 border-cyan-500/40">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-36 mira-skeleton"></div>
          <div className="h-3 w-28 mira-skeleton"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 mira-skeleton rounded-full"></div>
          <div className="h-8 w-10 mira-skeleton rounded-lg"></div>
        </div>
      </div>
      <div className="h-12 w-full mira-skeleton rounded-lg"></div>
      <div className="grid grid-cols-2 gap-3 p-4 bg-black/20 rounded-xl">
        <div className="space-y-2">
          <div className="h-3 w-24 mira-skeleton"></div>
          <div className="h-8 w-full mira-skeleton"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-24 mira-skeleton"></div>
          <div className="h-8 w-full mira-skeleton"></div>
        </div>
      </div>
    </div>
  );
}
