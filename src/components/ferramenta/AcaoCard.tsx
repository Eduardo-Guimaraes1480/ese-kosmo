'use client';
import React from 'react';
import { GripVertical, CheckSquare, Square, MoreVertical } from 'lucide-react';
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { cn } from '@/src/lib/utils';
import { Action, ManagementStatus, getEffectiveManagementStatus } from '@/src/types/ese-kosmo';
import { ActionFolder, MANAGEMENT_STATUS_MAP } from '@/src/components/prototypes/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcaoCardAction {
  id: string;
  title: string;
  status: string;
  type?: string;
  xp_reward?: number;
  ese_reward?: number;
  pillar?: string | null;
  pilar_impact?: number | null;
  radar_impact?: number | null;
  sacrifice_priority?: string | null;
  completed_at?: string | null;
  management_status?: ManagementStatus | string;
  due_date?: string | null;
  start_date?: string | null;
  impact_degree?: string;
  level_jump?: number;
  is_system?: boolean;
  is_shared?: boolean;
  visibility?: string;
  [key: string]: any;
}

interface AcaoCardProps {
  action: AcaoCardAction;
  pillarColor?: string;          // Tailwind bg class, e.g. "bg-blue-500"
  pillarHexColor?: string;       // Raw hex for inline style fallback
  folders?: ActionFolder[];      // Pastas para exibir tags
  /** Called immediately (optimistic) before/after the server responds */
  onStatusChange?: (actionId: string, newStatus: 'concluido' | 'pendente') => void;
  /** Open details modal */
  onDetailsClick?: (action: AcaoCardAction) => void;
  /** Whether to show drag handle (disabled in historico) */
  draggable?: boolean;
  /** Provided by @hello-pangea/dnd Draggable — pass undefined if not using DnD */
  dragProvided?: DraggableProvided;
  dragSnapshot?: DraggableStateSnapshot;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AcaoCard = ({
  action,
  pillarColor,
  pillarHexColor,
  folders,
  onStatusChange,
  onDetailsClick,
  draggable = true,
  dragProvided,
  dragSnapshot,
}: AcaoCardProps) => {
  const done = action.status === 'concluido';

  const handleCheckbox = () => {
    if (!onStatusChange) return;
    const newStatus = done ? 'pendente' : 'concluido';
    onStatusChange(action.id, newStatus);
  };

  // ── Wrapper: if DnD is active, use the drag ref; otherwise a plain div ──
  const wrapperProps = dragProvided
    ? {
        ref: dragProvided.innerRef,
        ...dragProvided.draggableProps,
      }
    : {};

  const isDragging = dragSnapshot?.isDragging ?? false;

  return (
    <div
      {...wrapperProps}
      className={cn(
        'flex items-center gap-2 p-4 rounded-xl border transition-all group select-none',
        isDragging
          ? 'shadow-[0_8px_24px_rgba(72,80,255,0.25)] bg-[#1a1d24] border-[#4850FF]/40 scale-[1.01]'
          : done
          ? 'bg-blue-900/20 border-blue-500/30 opacity-60'
          : 'bg-[#16181d] border-white/5 hover:border-white/10 hover:bg-[#1a1d24]'
      )}
    >
      {/* Drag handle */}
      {draggable && dragProvided && (
        <div
          {...dragProvided.dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors touch-none"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={handleCheckbox}
        className="flex-shrink-0 focus:outline-none transition-transform active:scale-90"
        title={done ? 'Desfazer' : 'Concluir'}
      >
        {done ? (
          <div className="w-6 h-6 rounded bg-[#4850FF] flex items-center justify-center shadow-[0_0_10px_rgba(72,80,255,0.3)]">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded bg-[#1f222a] border border-white/10 flex items-center justify-center">
            <Square className="w-5 h-5 text-gray-500" />
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={cn(
              'font-bold text-sm sm:text-base truncate',
              done ? 'text-gray-500 line-through decoration-gray-500/50' : 'text-white'
            )}
          >
            {action.title}
          </h4>
          {(() => {
            const effStatus = getEffectiveManagementStatus({
              due_date: action.due_date ?? null,
              status: action.status,
              management_status: action.management_status as any,
            });
            const statusMeta = MANAGEMENT_STATUS_MAP[effStatus];
            if (!statusMeta || effStatus === 'nao_definido') return null;
            return (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0',
                  statusMeta.badgeClass
                )}
                title={statusMeta.description}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dotClass)} />
                {statusMeta.shortLabel}
              </span>
            );
          })()}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-xs font-bold tracking-wide">
          <span className="text-gray-400">🔅 XP: {action.xp_reward ?? 0}</span>
          <span className="text-[#98A9FF]">💸 {action.ese_reward ?? 0}E$E</span>
          {action.subtasks && action.subtasks.length > 0 && (
            <span className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
              ☑ {action.subtasks.filter((s: any) => s.is_completed).length}/{action.subtasks.length}
            </span>
          )}
          {action.pillar && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-white uppercase truncate max-w-[100px]',
                pillarColor ?? 'bg-gray-600'
              )}
              style={!pillarColor && pillarHexColor ? { backgroundColor: pillarHexColor } : undefined}
              title={action.pillar}
            >
              {action.pillar}
            </span>
          )}
          {folders && action.folderIds && action.folderIds.length > 0 && (
            <div className="flex items-center gap-1">
              {action.folderIds.slice(0, 2).map((fid: string) => {
                const f = folders.find((item) => item.id === fid);
                if (!f) return null;
                return (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/10 bg-black/40 text-gray-300"
                    style={{ borderColor: `${f.color}40` }}
                    title={`Pasta: ${f.name}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="truncate max-w-[65px]">{f.name}</span>
                  </span>
                );
              })}
              {action.folderIds.length > 2 && (
                <span className="text-[9px] text-gray-500 font-mono">
                  +{action.folderIds.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details button */}
      <button
        onClick={() => onDetailsClick?.(action)}
        className="flex-shrink-0 p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        title="Detalhes / Editar"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
};
