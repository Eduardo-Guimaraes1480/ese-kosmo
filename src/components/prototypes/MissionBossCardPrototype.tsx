import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  GripVertical,
  MoreVertical,
  Award,
  Skull,
  Target,
  Brain,
  Code2,
  Coins,
  Sparkles,
  Flame,
  Trophy,
} from 'lucide-react';
import { ActionFolder, ActionItem, MANAGEMENT_STATUS_MAP } from './types';
import { FolderAssignPopover } from './FolderAssignPopover';

export interface MissionBossCardPrototypeProps {
  action: ActionItem;
  folders?: ActionFolder[];
  onToggleRequirement: (actionId: string, requirementId: string) => void;
  onToggleActionComplete?: (actionId: string) => void;
  onChangeFolderIds?: (actionId: string, nextFolderIds: string[]) => void;
  onEditClick?: (action: ActionItem) => void;
  defaultExpanded?: boolean;
}

const VOCATION_ICONS: Record<NonNullable<ActionItem['vocation_icon']>, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  code: Code2,
  coins: Coins,
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
};

function formatDatePtBr(dateStr: string): string {
  if (!dateStr) return 'Sem prazo';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const year = parts[0];
  const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
  const day = parseInt(parts[2], 10);
  return `${day} de ${months[monthIdx]} de ${year}`;
}

export const MissionBossCardPrototype: React.FC<MissionBossCardPrototypeProps> = ({
  action,
  folders = [],
  onToggleRequirement,
  onToggleActionComplete,
  onChangeFolderIds,
  onEditClick,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);
  const [expandedReqDescriptions, setExpandedReqDescriptions] = useState<Record<string, boolean>>({});

  const requirements = action.requirements ?? [];
  const totalReqs = requirements.length;
  const completedReqs = requirements.filter((r) => r.done).length;
  const completionPct = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;

  // For BOSS, the PDF shows "Barra de Vida do Boss" (HP remaining or defeated progress).
  // We calculate remaining Boss HP: starts at 100% and drops as requirements are completed.
  const isBoss = action.type === 'boss';
  const isConquista = action.type === 'conquista';
  const isDone = action.status === 'concluido';
  const bossRemainingHpPct = totalReqs > 0 ? Math.max(0, 100 - completionPct) : 100;

  const statusMeta = MANAGEMENT_STATUS_MAP[action.management_status];
  const VocationIcon = action.vocation_icon ? VOCATION_ICONS[action.vocation_icon] : Award;

  const theme = isBoss
    ? {
        cardBg: 'bg-[#210d0d] border-red-500/35 hover:border-red-400/55',
        headerBar: 'bg-white/10 text-red-200',
        vocationPill: 'bg-red-700 text-white',
        progressLabel: 'Barra de Vida do Boss',
        progressFill: 'bg-red-500',
        toggleBar: 'bg-[#1a0a0a] border-t border-red-500/20 text-gray-300 hover:text-white',
        reqHighlight: 'bg-red-900/25 border-red-500/40',
        checkColor: 'bg-red-600',
        typeName: 'BOSS',
        TypeIcon: Skull,
      }
    : isConquista
    ? {
        cardBg: 'bg-[#1e2007] border-yellow-600/35 hover:border-yellow-500/55',
        headerBar: 'bg-white/10 text-yellow-100',
        vocationPill: 'bg-purple-700 text-white',
        progressLabel: 'Barra de Progresso da Conquista',
        progressFill: 'bg-yellow-500',
        toggleBar: 'bg-[#171805] border-t border-yellow-600/20 text-gray-300 hover:text-white',
        reqHighlight: 'bg-yellow-900/20 border-yellow-500/40',
        checkColor: 'bg-yellow-600',
        typeName: 'Conquista',
        TypeIcon: Trophy,
      }
    : {
        cardBg: 'bg-[#190e2e] border-purple-500/35 hover:border-purple-400/55',
        headerBar: 'bg-white/10 text-purple-100',
        vocationPill: 'bg-emerald-600 text-white',
        progressLabel: 'Barra de Conclusão',
        progressFill: 'bg-purple-500',
        toggleBar: 'bg-[#130a24] border-t border-purple-500/20 text-gray-300 hover:text-white',
        reqHighlight: 'bg-purple-900/25 border-purple-500/40',
        checkColor: 'bg-purple-600',
        typeName: 'Missão',
        TypeIcon: Target,
      };

  const toggleReqDesc = (reqId: string) => {
    setExpandedReqDescriptions((prev) => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  return (
    <article
      className={`rounded-2xl border transition-all overflow-hidden shadow-lg ${theme.cardBg} ${
        isDone ? 'opacity-70' : ''
      }`}
    >
      {/* Card Main Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Left Grip + Checkbox + Optional Vocation Emblem (Pages 8 & 9) */}
          <div className="flex flex-col items-center gap-3 shrink-0 pt-1">
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-gray-600 hidden sm:block" />
              <button
                type="button"
                onClick={() => onToggleActionComplete?.(action.id)}
                className="transition-transform active:scale-90 cursor-pointer"
                title={isDone ? 'Reabrir ação' : 'Marcar como concluída'}
                aria-label={isDone ? 'Reabrir ação' : 'Marcar como concluída'}
              >
                {isDone ? (
                  <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded bg-black/40 border border-white/20 flex items-center justify-center">
                    <Square className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </button>
            </div>

            {(isBoss || isConquista) && (
              <div className="w-20 rounded-xl bg-black/45 border border-white/10 p-2 flex flex-col items-center text-center gap-1.5">
                <span className="text-[8px] font-semibold text-gray-400 leading-tight">
                  {isBoss ? 'Ícone da Vocação' : 'Ícone da Conquista'}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    isBoss
                      ? 'bg-red-950/80 border-red-500/40 text-red-300'
                      : 'bg-yellow-950/80 border-yellow-500/40 text-yellow-300'
                  }`}
                >
                  <VocationIcon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-gray-200 leading-tight line-clamp-2">
                  {action.new_vocation || 'Vocação Escolhida'}
                </span>
              </div>
            )}
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title + Status Dot + Edit Button */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={`font-heading font-black text-base sm:text-lg tracking-wide text-white truncate ${
                    isDone ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {action.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold tabular-nums">
                  <span className="text-amber-300">XP: {action.xp_reward}</span>
                  <span className="text-[#98A9FF]">{action.ese_reward} E$E</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {folders.length > 0 && onChangeFolderIds && (
                  <FolderAssignPopover
                    folders={folders}
                    selectedFolderIds={action.folderIds}
                    onChangeFolderIds={(next) => onChangeFolderIds(action.id, next)}
                    compact
                  />
                )}
                <button
                  type="button"
                  onClick={() => onEditClick?.(action)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  title="Editar ou ver detalhes"
                  aria-label="Editar ou ver detalhes"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Date & Time Strip */}
            <div
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums ${theme.headerBar}`}
            >
              <span>{formatDatePtBr(action.due_date)}</span>
              {action.due_time ? <span>{action.due_time}</span> : null}
            </div>

            {/* Vocation Bonus & Pillar Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {action.vocation_bonus ? (
                <span
                  className={`px-3 py-1 rounded-md text-[11px] font-black tracking-wider uppercase ${theme.vocationPill}`}
                >
                  {action.vocation_bonus}
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-semibold">
                  {action.new_vocation || 'Sem vocação definida'}
                </span>
              )}

              <div className="flex flex-wrap gap-1.5">
                {action.pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="px-3 py-1 rounded-md bg-black/70 border border-white/10 text-[11px] font-black tracking-wider uppercase text-white"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress / Boss HP Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="italic text-gray-300 font-medium">{theme.progressLabel}</span>
                <span className="font-mono font-bold text-gray-200 tabular-nums">
                  {isBoss
                    ? `HP Boss: ${bossRemainingHpPct}% (${completedReqs}/${totalReqs} golpes)`
                    : `${completionPct}% concluído`}
                </span>
              </div>
              <div className="w-full h-4 bg-white/85 rounded-md overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${theme.progressFill}`}
                  style={{
                    width: `${isBoss ? bossRemainingHpPct : completionPct}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 tabular-nums">
                <span>
                  {completedReqs}/{totalReqs} Requisitos
                </span>
                {totalReqs > 0 && (
                  <span className="text-gray-400">
                    {isBoss ? '-' : '+'}
                    {(100 / totalReqs).toFixed(2).replace('.', ',')}% por requisito
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Requirements Checklist */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5">
            {requirements.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-3">
                Nenhum requisito vinculado ainda. Clique no menu para adicionar.
              </p>
            ) : (
              requirements.map((req) => {
                const descOpen = Boolean(expandedReqDescriptions[req.id]);
                return (
                  <div
                    key={req.id}
                    className={`rounded-xl border p-3 transition-all ${
                      req.done
                        ? theme.reqHighlight
                        : 'bg-[#101316]/90 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleRequirement(action.id, req.id)}
                        className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
                        aria-label={`Alternar requisito ${req.title}`}
                      >
                        {req.done ? (
                          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                            <CheckSquare className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-[#1d2228] border border-white/15 flex items-center justify-center">
                            <Square className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-bold truncate ${
                              req.done ? 'text-gray-300 line-through' : 'text-white'
                            }`}
                          >
                            {req.title}
                          </p>
                          {req.timeLabel && (
                            <span className="px-2 py-0.5 rounded bg-sky-600/80 text-[10px] font-mono font-bold text-white shrink-0 tabular-nums">
                              {req.timeLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] font-bold tabular-nums">
                          <span className="text-amber-300">XP: {req.xp_reward}</span>
                          <span className="text-[#98A9FF]">{req.ese_reward} E$E</span>
                          <span className="text-gray-500 font-medium">
                            {req.source === 'criado' ? 'Criado' : 'Referenciado'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleReqDesc(req.id)}
                          className="mt-1.5 text-[11px] italic text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          {descOpen
                            ? 'esconder descrição'
                            : req.description
                            ? 'text description reveal +++'
                            : 'sem descrição adicional'}
                        </button>

                        {descOpen && req.description && (
                          <p className="mt-1.5 text-xs text-gray-300 bg-black/35 rounded-lg p-2.5 border border-white/5">
                            {req.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Reveal / Hide Toggle Bar (matching PDF Pages 7-9) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold italic transition-colors cursor-pointer ${theme.toggleBar}`}
      >
        <span className="mx-auto">
          {expanded
            ? `Esconder requisitos ${isBoss ? 'do BOSS' : isConquista ? 'da Conquista' : 'da Missão'} acima`
            : `Revelar requisitos ${isBoss ? 'do BOSS' : isConquista ? 'da Conquista' : 'da Missão'} abaixo`}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0" />
        )}
      </button>
    </article>
  );
};
