'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import { Header } from '@/src/components/ui/Header';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { Sidebar } from '@/src/components/ui/Sidebar';
import { BottomNav } from '@/src/components/ui/BottomNav';
import { CreateActionModal } from '@/src/components/ferramenta/CreateActionModal';
import { ActionDetailsModal } from '@/src/components/ferramenta/ActionDetailsModal';
import { AcaoCard } from '@/src/components/ferramenta/AcaoCard';
import { completeAction, undoAction } from '@/src/lib/gamification/actionEngine';

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

  const [userId, setUserId]             = useState<string | null>(null);
  const [pillars, setPillars]           = useState<any[]>([]);
  const [actions, setActions]           = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const meta = CATEGORY_META[categoria] ?? CATEGORY_META['todas'];

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (uid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [actRes, pilRes] = await Promise.all([
        buildQuery(uid, categoria).order('order_index', { ascending: true }),
        supabase.from('pillars').select('*').eq('user_id', uid),
      ]);
      if (actRes.error) throw actRes.error;
      if (pilRes.error) throw pilRes.error;
      setActions(actRes.data ?? []);
      setPillars(pilRes.data ?? []);
    } catch (e: any) {
      console.error(e);
      setError('Erro ao carregar as ações. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [categoria]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUserId(session.user.id);
      fetchAll(session.user.id);
    });
  }, [fetchAll, router]);

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

          {/* Section Title */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="font-sans font-black text-lg tracking-widest uppercase text-white">
              MINHAS AÇÕES
            </h2>
            <span className="text-xs text-gray-600 font-bold tracking-wider">
              {actions.length} {actions.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

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
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
              <div className="text-4xl">📭</div>
              <p className="text-sm font-bold tracking-widest uppercase">Nenhuma ação aqui</p>
              {categoria !== 'historico' && (
                <p className="text-xs text-gray-700 text-center">
                  Use o botão acima para criar sua primeira ação nesta categoria.
                </p>
              )}
            </div>
          ) : (
            /* Action list with Drag & Drop */
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="actions-list" isDropDisabled={categoria === 'historico'}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2.5 pt-1"
                  >
                    {actions.map((action, index) => (
                      <Draggable
                        key={action.id}
                        draggableId={action.id}
                        index={index}
                        isDragDisabled={categoria === 'historico'}
                      >
                        {(drag, snapshot) => (
                          <AcaoCard
                            action={action}
                            pillarColor={getPillarColor(action.pillar)}
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

        {/* Modals */}
        {isCreateOpen && (
          <CreateActionModal
            pillars={pillars}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => {
              setIsCreateOpen(false);
              if (userId) fetchAll(userId);
            }}
          />
        )}

        {selectedAction && (
          <ActionDetailsModal
            action={selectedAction}
            pillars={pillars}
            onClose={() => setSelectedAction(null)}
            onSuccess={() => {
              setSelectedAction(null);
              if (userId) fetchAll(userId);
            }}
            onDelete={() => {
              setSelectedAction(null);
              if (userId) fetchAll(userId);
            }}
          />
        )}

        <BottomNav active="/acoes" />
      </div>
    </div>
  );
}
