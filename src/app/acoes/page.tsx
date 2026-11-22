'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActionsHubPrototype } from '@/src/components/prototypes/ActionsHubPrototype';
import { HubFilterType, HubSection, ViewMode } from '@/src/components/prototypes/types';
import { Loader2 } from 'lucide-react';

function ActionsHubPageContent() {
  const searchParams = useSearchParams();

  const sectionParam = searchParams.get('section') as HubSection | null;
  const viewParam = searchParams.get('view') as ViewMode | null;
  const filterParam = searchParams.get('filter') as HubFilterType | null;
  const folderParam = searchParams.get('folder');

  const initialSection: HubSection =
    sectionParam === 'explorer' || sectionParam === 'workspace' ? sectionParam : 'hub';

  const initialViewMode: ViewMode =
    viewParam === 'calendario' || viewParam === 'cronologia' || viewParam === 'tabela'
      ? viewParam
      : 'tabela';

  const validFilters: HubFilterType[] = [
    'todas',
    'diaria',
    'fazer',
    'meta',
    'conquista',
    'boss',
    'problema',
    'historico',
  ];
  const initialTypeFilter: HubFilterType =
    filterParam && validFilters.includes(filterParam) ? filterParam : 'todas';

  const initialFolderId = folderParam ?? 'all';

  return (
    <ActionsHubPrototype
      initialSection={initialSection}
      initialViewMode={initialViewMode}
      initialTypeFilter={initialTypeFilter}
      initialFolderId={initialFolderId}
    />
  );
}

export default function ActionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0B0F10] text-[#FEFEFE]">
          <Loader2 className="w-8 h-8 text-[#4850FF] animate-spin" />
        </div>
      }
    >
      <ActionsHubPageContent />
    </Suspense>
  );
}
