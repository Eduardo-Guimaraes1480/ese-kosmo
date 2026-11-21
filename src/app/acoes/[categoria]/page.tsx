'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2, AlertCircle, FolderTree, X, FolderOpen } from 'lucide-react';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import { Header } from '@/src/components/ui/Header';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { Sidebar } from '@/src/components/ui/Sidebar';
import { BottomNav } from '@/src/components/ui/BottomNav';
import { ActionFormModal } from '@/src/components/ferramenta/ActionFormModal';
import { AcaoCard } from '@/src/components/ferramenta/AcaoCard';
import { FolderManager } from '@/src/components/ferramenta/FolderManager';
import { completeAction, undoAction } from '@/src/lib/gamification/actionEngine';
import { fetchActionsWithRelations } from '@/src/lib/actions/actionService';
import { fetchFoldersForUser } from '@/src/lib/actions/folderService';
import { getDescendantFolderIds, getFolderPathLabel } from '@/src/components/prototypes/folderUtils';
import { ActionFolder, ActionItem, ActionType } from '@/src/components/prototypes/types';

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { title: string; badge: string }> = {
  todas:     { title: 'TODAS AÇÕES',    badge: 'PENDENTES'     },
  diaria:    { title: 'DIÁRIAS',        badge: 'MAX 20 | FREE' },
  fazer:     { title: 'FAZER',          badge: 'MAX 10/DIA'    },
  meta:      { title: 'MISSÕES',        badge: 'MAX 5/MÊS'     },
  conquista: { title: 'CONQUISTAS',     badge: 'MAX 3/MÊS'     },
  boss:      { title: 'BOSS',           badge: 'MAX 1/MÊS'     },
  problema:  { title: 'PROBLEMAS',      badge: 'MAX 10/DIA'    },
  historico: { title: 'BANCO DE DADOS', badge: 'HISTÓRICO'     },
};

const PILLS = [
  { label: 'TODAS',      key: 'todas'     },
  { label: 'DIÁRIAS',   key: 'diaria'    },
  { label: 'FAZER',     key: 'fazer'     },
  { label: 'MISSÕES',   key: 'meta'      },
  { label: 'CONQUISTAS',key: 'conquista' },
  { label: 'BOSS',      key: 'boss'      },
  { label: 'PROBLEMAS', key: 'problema'  },
  { label: 'HISTÓRICO', key: 'historico' },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function buildQuery(userId: string, categoria: string) {
  const base = supabase.from('actions').select('*').eq('user_id', userId);
  if (categoria === 'historico') return base.eq('status', 'concluido');
  if (categoria === 'todas')     return base.neq('status', 'concluido');
  return base.neq('status', 'concluido').eq('type', categoria);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriaPage() {
  const { categoria } = useParams() as { categoria: string };
  const router = useRouter();

  const [userId, setUserId]                 = useState<string | null>(null);
  const [pillars, setPillars]               = useState<any[]>([]);
  const [actions, setActions]               = useState<ActionItem[]>([]);
  const [folders, setFolders]               = useState<ActionFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'loose'>('all');
  const [isFolderPanelOpen, setIsFolderPanelOpen] = useState(false);
  const [draggedActionId, setDraggedActionId] = useState<string | null>(null);

  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen]     = useState(false);
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const meta = CATEGORY_META[categoria] ?? CATEGORY_META['todas'];

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [allActions, pilRes, foldersRes] = await Promise.all([
        fetchActionsWithRelations(uid),
        supabase.from('pillars').select('*').eq('user_id', uid),
        fetchFoldersForUser().catch(() => []),
      ]);
      if (pilRes.error) throw pilRes.error;

      setActions(allActions);
      setPillars(pilRes.data ?? []);
      setFolders(foldersRes ?? []);
    } catch (e: any) {
      console.error(e);
      setError('Erro ao carregar as ações. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUserId(session.user.id);
      fetchAll(session.user.id);
    });
  }, [fetchAll, router]);

  // Ações filtradas por categoria
  const categoryActions = useMemo(() => {
    if (categoria === 'historico') {
      return actions.filter((a) => a.status === 'concluido');
    }
    if (categoria === 'todas') {
      return actions.filter((a) => a.status !== 'concluido');
    }
    return actions.filter(
      (a) => a.status !== 'concluido' && a.type === categoria
    );
  }, [actions, categoria]);

  // Ações filtradas adicionalmente pela pasta selecionada
  const displayedActions = useMemo(() => {
    if (selectedFolderId === 'all') return categoryActions;
    if (selectedFolderId === 'loose') {
      return categoryActions.filter(
        (a) => !a.folderIds || a.folderIds.length === 0
      );
    }
    const descendantIds = new Set(getDescendantFolderIds(folders, selectedFolderId));
    return categoryActions.filter((a) =>
      a.folderIds?.some((fid) => descendantIds.has(fid))
    );
  }, [categoryActions, selectedFolderId, folders]);

  // Rótulo da pasta selecionada (se houver)
  const activeFolderLabel = useMemo(() => {
    if (selectedFolderId === 'all' || selectedFolderId === 'loose') return null;
    return getFolderPathLabel(folders, selectedFolderId);
  }, [folders, selectedFolderId]);

  // ── Optimistic status change ───────────────────────────────────────────────

  const handleStatusChange = useCallback(async (actionId: string, newStatus: 'concluido' | 'pendente') => {
    if (!userId) return;

    // 1 — Immediately update local state (zero-flicker)
    setActions(prev =>
      prev.map(a => a.id === actionId ? { ...a, status: newStatus } : a)
    );

    // 2 — Run RPG engine server-side
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    if (newStatus === 'concluido') {
      const result = await completeAction(action, userId);
      if (!result.ok) {
        // Revert on failure
        setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: action.status } : a));
      }
    } else {
      const result = await undoAction(action, userId);
      if (!result.ok) {
        setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: action.status } : a));
      }
    }
  }, [userId, actions]);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = [...actions];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setActions(reordered);
    reordered.forEach((a, i) => {
      supabase.from('actions').update({ order_index: i }).eq('id', a.id).then(() => {});
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Pillar color helper ────────────────────────────────────────────────────
  const getPillarColor = (pillarName: string) => {
    const p = pillars.find(x => x.name?.toLowerCase() === pillarName?.toLowerCase());
    return p?.color ?? 'bg-gray-600';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0f1115] text-[#FEFEFE] font-sans selection:bg-[#4850FF]/30 overflow-hidden">

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Smart Header — self-fetches user data, no userData prop needed */}
        <Header
          title={meta.title}
          badge={meta.badge}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5" style={{ scrollbarWidth: 'none' }}>

          {/* Section Title & Folder Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div>
              <h2 className="font-sans font-black text-lg tracking-widest uppercase text-white">
                MINHAS AÇÕES
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 font-bold tracking-wider">
                  {displayedActions.length} {displayedActions.length === 1 ? 'item exibido' : 'itens exibidos'}
                  {categoryActions.length !== displayedActions.length && ` (de ${categoryActions.length})`}
                </span>

                {/* Tag de pasta ativa com botão de limpar */}
                {activeFolderLabel && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4850FF]/20 border border-[#4850FF]/40 text-[#98A9FF] text-[11px] font-semibold">
                    <FolderOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[180px]">{activeFolderLabel}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId('all')}
                      className="hover:text-white cursor-pointer"
                      title="Limpar filtro de pasta"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {selectedFolderId === 'loose' && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[11px] font-semibold">
                    <span>Soltas (Sem pasta)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId('all')}
                      className="hover:text-white cursor-pointer"
                      title="Limpar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Alternância do Painel de Pastas */}
            <button
              type="button"
              onClick={() => setIsFolderPanelOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer self-start sm:self-auto',
                isFolderPanelOpen || selectedFolderId !== 'all'
                  ? 'bg-[#4850FF]/20 border-[#4850FF]/50 text-[#98A9FF] shadow-[0_0_12px_rgba(72,80,255,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              <FolderTree className="w-4 h-4 text-[#98A9FF]" />
              <span>PASTAS</span>
              {folders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#4850FF] text-white text-[9px] font-black">
                  {folders.length}
                </span>
              )}
            </button>
          </div>

          {/* Painel do FolderManager quando aberto */}
          {isFolderPanelOpen && userId && (
            <div className="pt-1">
              <FolderManager
                userId={userId}
                folders={folders}
                actions={actions}
                selectedFolderId={selectedFolderId}
                onSelectFolder={(fId) => setSelectedFolderId(fId)}
                onFoldersChanged={() => fetchAll(userId)}
                draggedActionId={draggedActionId}
              />
            </div>
          )}

          {/* Category Pills */}
          <div className="grid grid-cols-4 gap-1.5">
            {PILLS.map(pill => {
              const isActive = pill.key === categoria;
              return (
                <button
                  key={pill.key}
                  onClick={() => router.push(`/acoes/${pill.key}`)}
                  className={cn(
                    'py-1.5 px-1 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 text-center truncate border',
                    isActive
                      ? 'bg-[#1a1f2a] text-[#98A9FF] border-[#4850FF]/50 shadow-[0_0_10px_rgba(72,80,255,0.15)]'
                      : 'bg-[#16181d] text-gray-500 border-white/5 hover:bg-[#1f222a] hover:text-gray-300'
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Create button — hidden for historico */}
          {categoria !== 'historico' && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <h3 className="font-sans font-bold text-xs tracking-widest uppercase text-gray-500">
                CRIE UMA NOVA AÇÃO
              </h3>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full bg-[#4850FF] hover:bg-[#3840ee] border border-[#4850FF]/50 shadow-[0_0_15px_rgba(72,80,255,0.3)] text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                <span className="font-black tracking-widest uppercase text-sm">
                  CRIAR {meta.title.split(' ')[0]}
                </span>
              </button>
            </div>
          )}

          {/* Content states */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs tracking-widest uppercase font-bold">Carregando...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold text-center">{error}</p>
              <button
                onClick={() => userId && fetchAll(userId)}
                className="text-xs tracking-widest uppercase font-bold text-gray-400 hover:text-white border border-white/10 rounded-lg px-4 py-2 hover:bg-white/5 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : displayedActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
              <div className="text-4xl">📭</div>
              <p className="text-sm font-bold tracking-widest uppercase">
                {selectedFolderId !== 'all' ? 'Nenhuma ação nesta pasta' : 'Nenhuma ação aqui'}
              </p>
              {categoria !== 'historico' && (
                <p className="text-xs text-gray-700 text-center">
                  {selectedFolderId !== 'all'
                    ? 'Use o botão acima para criar uma nova ação vinculada a esta pasta.'
                    : 'Use o botão acima para criar sua primeira ação nesta categoria.'}
                </p>
              )}
            </div>
          ) : (
            /* Action list with Drag & Drop */
            <DragDropContext
              onDragStart={(start) => setDraggedActionId(start.draggableId)}
              onDragEnd={(res) => {
                setDraggedActionId(null);
                handleDragEnd(res);
              }}
            >
              <Droppable droppableId="actions-list" isDropDisabled={categoria === 'historico'}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2.5 pt-1"
                  >
                    {displayedActions.map((action, index) => (
                      <Draggable
                        key={action.id}
                        draggableId={action.id}
                        index={index}
                        isDragDisabled={categoria === 'historico'}
                      >
                        {(drag, snapshot) => (
                          <AcaoCard
                            action={action}
                            pillarColor={getPillarColor(action.pillars?.[0] || '')}
                            folders={folders}
                            draggable={categoria !== 'historico'}
                            dragProvided={drag}
                            dragSnapshot={snapshot}
                            onStatusChange={categoria !== 'historico' ? handleStatusChange : undefined}
                            onDetailsClick={setSelectedAction}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </main>

        {/* Modal de Criação e Edição em Abas (ActionFormModal) */}
        {(isCreateOpen || selectedAction) && (
          <ActionFormModal
            isOpen={isCreateOpen || Boolean(selectedAction)}
            initialAction={selectedAction}
            initialType={
              categoria === 'todas' || categoria === 'historico'
                ? 'fazer'
                : (categoria as ActionType)
            }
            initialFolderIds={
              selectedFolderId !== 'all' && selectedFolderId !== 'loose'
                ? [selectedFolderId]
                : []
            }
            onClose={() => {
              setIsCreateOpen(false);
              setSelectedAction(null);
            }}
            onSuccess={() => {
              setIsCreateOpen(false);
              setSelectedAction(null);
              if (userId) fetchAll(userId);
            }}
          />
        )}

        <BottomNav
          active="/acoes"
          onActionClick={() => setIsCreateOpen(true)}
        />
      </div>
    </div>
  );
}
