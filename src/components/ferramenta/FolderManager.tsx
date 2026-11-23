'use client';
import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Layers,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Palette,
  ArrowRight,
  FolderTree,
} from 'lucide-react';
import { ActionFolder, ActionItem } from '@/src/components/prototypes/types';
import {
  getFolderChildren,
  getFolderPath,
  getDescendantFolderIds,
} from '@/src/components/prototypes/folderUtils';
import {
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder,
  assignActionToFolder,
  isFolderDescendantOf,
} from '@/src/lib/actions/folderService';

// Cores temáticas do Design System ESE Kosmo
const FOLDER_COLOR_PALETTE = [
  '#4850FF', // Azul ESE Accent
  '#38BDF8', // Sky Azul Claro
  '#818CF8', // Indigo
  '#A855F7', // Roxo Kosmo
  '#22C55E', // Esmeralda / Sucesso
  '#F97316', // Laranja
  '#EF4444', // Vermelho Perigo
  '#EAB308', // Amarelo / Destaque
];

export interface FolderManagerProps {
  userId: string;
  folders: ActionFolder[];
  actions: ActionItem[];
  selectedFolderId: string | 'all' | 'loose';
  onSelectFolder: (folderId: string | 'all' | 'loose') => void;
  onFoldersChanged: () => void;
  draggedActionId?: string | null;
  className?: string;
  compact?: boolean;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  userId,
  folders,
  actions,
  selectedFolderId,
  onSelectFolder,
  onFoldersChanged,
  draggedActionId = null,
  className = '',
  compact = false,
}) => {
  // Estado de expansão da árvore
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    // Expandir por padrão pastas de nível superior
    const initial: Record<string, boolean> = {};
    folders.forEach((f) => {
      if (!f.parent_folder_id) initial[f.id] = true;
    });
    return initial;
  });

  // Modos de gerenciamento
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);

  // Formulário de Nova Pasta / Subpasta
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState('#4850FF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edição / Renomeação inline
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameColor, setRenameColor] = useState('#4850FF');

  // Mover pasta
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null);

  // Drag over feedback
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Contagem de ações soltas (sem pasta)
  const looseActionsCount = useMemo(() => {
    return actions.filter((a) => !a.folderIds || a.folderIds.length === 0).length;
  }, [actions]);

  // Contagem de ações por pasta (incluindo descendentes)
  const getActionCountForFolder = (folderId: string): number => {
    const descendantIds = new Set(getDescendantFolderIds(folders, folderId));
    return actions.filter((a) => a.folderIds?.some((fid) => descendantIds.has(fid))).length;
  };

  // Toggle expansão
  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Breadcrumb da pasta selecionada
  const activeBreadcrumbs = useMemo(() => {
    if (selectedFolderId === 'all' || selectedFolderId === 'loose') return [];
    return getFolderPath(folders, selectedFolderId);
  }, [folders, selectedFolderId]);

  // Criar Pasta
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newFolder = await createFolder(userId, {
        name: createName.trim(),
        color: createColor,
        parent_folder_id: createParentId,
      });

      // Expandir pasta pai se for subpasta
      if (createParentId) {
        setExpandedFolders((prev) => ({ ...prev, [createParentId]: true }));
      }

      setCreateName('');
      setShowCreateForm(false);
      setCreateParentId(null);
      onSelectFolder(newFolder.id);
      onFoldersChanged();
    } catch (err: any) {
      console.error('Erro ao criar pasta:', err);
      alert(`Falha ao criar pasta: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renomear / Atualizar Pasta
  const handleRenameSubmit = async (folderId: string) => {
    if (!renameValue.trim()) return;
    try {
      await updateFolder(folderId, {
        name: renameValue.trim(),
        color: renameColor,
      });
      setRenamingFolderId(null);
      onFoldersChanged();
    } catch (err: any) {
      console.error('Erro ao atualizar pasta:', err);
      alert(`Falha ao atualizar pasta: ${err?.message || 'Erro inesperado'}`);
    }
  };

  // Excluir Pasta
  const handleDeleteFolder = async (folder: ActionFolder) => {
    const hasChildren = folders.some((f) => f.parent_folder_id === folder.id);
    const msg = hasChildren
      ? `A pasta "${folder.name}" possui subpastas. Excluí-la também removerá as subpastas da hierarquia. Suas ações não serão apagadas. Deseja continuar?`
      : `Excluir a pasta "${folder.name}"? Suas ações não serão apagadas.`;

    if (!window.confirm(msg)) return;

    try {
      await deleteFolder(folder.id);
      if (selectedFolderId === folder.id) {
        onSelectFolder('all');
      }
      onFoldersChanged();
    } catch (err: any) {
      console.error('Erro ao excluir pasta:', err);
      alert(`Falha ao excluir pasta: ${err?.message || 'Erro inesperado'}`);
    }
  };

  // Mover Pasta (Prevenção de Ciclos)
  const handleMoveFolder = async (targetParentId: string | null) => {
    if (!movingFolderId) return;

    // Prevenção de ciclo local antes do envio
    if (targetParentId && isFolderDescendantOf(folders, targetParentId, movingFolderId)) {
      alert('Não é possível mover uma pasta para dentro de si mesma ou de suas subpastas.');
      return;
    }

    try {
      await moveFolder(movingFolderId, targetParentId);
      if (targetParentId) {
        setExpandedFolders((prev) => ({ ...prev, [targetParentId]: true }));
      }
      setMovingFolderId(null);
      onFoldersChanged();
    } catch (err: any) {
      console.error('Erro ao mover pasta:', err);
      alert(`Falha ao mover pasta: ${err?.message || 'Ciclo detectado ou erro no banco'}`);
    }
  };

  // Drop de ação em pasta
  const handleActionDrop = async (folderId: string) => {
    if (!draggedActionId) return;
    try {
      await assignActionToFolder(userId, draggedActionId, folderId);
      onFoldersChanged();
    } catch (err) {
      console.error('Erro ao associar ação à pasta via drag & drop:', err);
    }
  };

  // Renderização recursiva dos nós da árvore
  const renderTree = (parentId: string | null, depth = 0): React.ReactNode => {
    const children = getFolderChildren(folders, parentId);
    if (children.length === 0) return null;

    return children.map((folder) => {
      const subChildren = getFolderChildren(folders, folder.id);
      const hasChildren = subChildren.length > 0;
      const isExpanded = Boolean(expandedFolders[folder.id]);
      const isActive = selectedFolderId === folder.id;
      const count = getActionCountForFolder(folder.id);
      const isRenaming = renamingFolderId === folder.id;
      const isMovingThis = movingFolderId === folder.id;
      const isDragTarget = dragOverFolderId === folder.id;

      return (
        <div key={folder.id} className="space-y-1">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverFolderId(folder.id);
            }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(null);
              handleActionDrop(folder.id);
            }}
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className={`group relative flex items-center justify-between gap-1.5 py-1.5 pr-2 rounded-lg text-xs transition-all ${
              isDragTarget
                ? 'bg-[#4850FF]/25 border border-[#4850FF] shadow-[0_0_12px_rgba(72,80,255,0.3)]'
                : isActive
                ? 'bg-[#4850FF]/20 text-white border border-[#4850FF]/40 font-semibold'
                : 'text-gray-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            {/* Linha de edição inline */}
            {isRenaming ? (
              <div className="flex items-center gap-1.5 w-full pr-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 bg-black/60 border border-[#4850FF]/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(folder.id);
                    if (e.key === 'Escape') setRenamingFolderId(null);
                  }}
                />
                <div className="flex items-center gap-0.5">
                  {FOLDER_COLOR_PALETTE.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRenameColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                        renameColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleRenameSubmit(folder.id)}
                  className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  title="Salvar"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingFolderId(null)}
                  className="p-1 text-gray-400 hover:text-white cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Botão de expansão + Ícone + Nome */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(folder.id);
                      }}
                      className="p-0.5 text-gray-400 hover:text-white cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer truncate"
                  >
                    <span
                      className="shrink-0 flex items-center"
                      style={{ color: folder.color || '#4850FF' }}
                    >
                      {isActive ? (
                        <FolderOpen className="w-4 h-4" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                    </span>
                    <span className="truncate">{folder.name}</span>
                  </button>
                </div>

                {/* Contagem e Botões de Ação */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 tabular-nums px-1">
                    {count}
                  </span>

                  {/* Criar subpasta */}
                  <button
                    type="button"
                    onClick={() => {
                      setCreateParentId(folder.id);
                      setShowCreateForm(true);
                      setCreateColor(folder.color || '#4850FF');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-opacity"
                    title={`Criar subpasta em "${folder.name}"`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  {/* Renomear / Editar */}
                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFolderId(folder.id);
                        setRenameValue(folder.name);
                        setRenameColor(folder.color || '#4850FF');
                      }}
                      className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                      title="Renomear"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Mover */}
                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={() => setMovingFolderId(isMovingThis ? null : folder.id)}
                      className={`p-1 rounded cursor-pointer ${
                        isMovingThis
                          ? 'bg-[#4850FF] text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isMovingThis ? 'Cancelando mover' : 'Mover pasta'}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Excluir */}
                  {isDeletingMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder)}
                      className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer"
                      title="Excluir pasta"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Subpastas recursivas quando expandido */}
          {hasChildren && isExpanded && renderTree(folder.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div
      className={`bg-[#121619]/90 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-md flex flex-col space-y-3 ${className}`}
    >
      {/* Cabeçalho do Gerenciador de Pastas */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[#98A9FF]" />
          <h3 className="font-sans font-bold text-xs tracking-wider uppercase text-white">
            Pastas
          </h3>
          <span className="text-[10px] text-gray-500 font-mono">
            ({folders.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nova Pasta Raiz */}
          <button
            type="button"
            onClick={() => {
              setCreateParentId(null);
              setShowCreateForm((prev) => !prev);
            }}
            className="p-1.5 rounded-lg bg-[#4850FF]/20 text-[#98A9FF] hover:bg-[#4850FF]/30 border border-[#4850FF]/40 cursor-pointer transition-colors"
            title="Criar nova pasta raiz"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          {/* Modo Editar */}
          <button
            type="button"
            onClick={() => {
              setIsEditingMode((prev) => !prev);
              setIsDeletingMode(false);
              setMovingFolderId(null);
            }}
            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
              isEditingMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
            }`}
            title="Modo de edição/renomeação"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Modo Excluir */}
          <button
            type="button"
            onClick={() => {
              setIsDeletingMode((prev) => !prev);
              setIsEditingMode(false);
              setMovingFolderId(null);
            }}
            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
              isDeletingMode
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
            }`}
            title="Modo de exclusão de pastas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Banner de Ajuda ao Mover Pasta */}
      {movingFolderId && (
        <div className="p-2 bg-[#4850FF]/15 border border-[#4850FF]/40 rounded-xl space-y-1.5 text-xs text-[#98A9FF]">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              Mover &quot;{folders.find((f) => f.id === movingFolderId)?.name}&quot; para:
            </span>
            <button
              type="button"
              onClick={() => setMovingFolderId(null)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              type="button"
              onClick={() => handleMoveFolder(null)}
              className="px-2 py-1 rounded bg-black/40 border border-white/20 text-[11px] text-white hover:bg-white/10 cursor-pointer"
            >
              Raiz (Nenhuma pasta pai)
            </button>
            {folders
              .filter(
                (f) =>
                  f.id !== movingFolderId &&
                  !isFolderDescendantOf(folders, f.id, movingFolderId)
              )
              .map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleMoveFolder(f.id)}
                  className="px-2 py-1 rounded bg-black/40 border border-white/20 text-[11px] text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer truncate max-w-[130px]"
                >
                  📁 {f.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Formulário de Criação de Pasta */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-2.5 bg-black/40 border border-white/15 rounded-xl space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#98A9FF] text-[11px] uppercase tracking-wider">
              {createParentId
                ? `Nova Subpasta em "${folders.find((f) => f.id === createParentId)?.name}"`
                : 'Nova Pasta Raiz'}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setCreateParentId(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Nome da pasta..."
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#4850FF]"
            autoFocus
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex items-center gap-1">
                {FOLDER_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCreateColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                      createColor === color
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !createName.trim()}
              className="px-3 py-1 rounded-lg bg-[#4850FF] hover:bg-[#3840ee] disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
            >
              {isSubmitting ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {/* Breadcrumb Navegável da Pasta Atual */}
      {activeBreadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-gray-400 overflow-x-auto py-1 px-1 bg-black/25 rounded-lg border border-white/5 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectFolder('all')}
            className="hover:text-white shrink-0 cursor-pointer"
          >
            Todas
          </button>
          {activeBreadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.id}>
              <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
              <button
                type="button"
                onClick={() => onSelectFolder(bc.id)}
                className={`truncate max-w-[110px] cursor-pointer ${
                  idx === activeBreadcrumbs.length - 1
                    ? 'text-[#98A9FF] font-bold'
                    : 'hover:text-white'
                }`}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Atalhos Rápidos: Todas e Soltas */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectFolder('all')}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            selectedFolderId === 'all'
              ? 'bg-[#4850FF]/20 text-white border border-[#4850FF]/40 font-semibold'
              : 'text-gray-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-[#98A9FF]" />
            <span>Todas as Ações</span>
          </span>
          <span className="text-[10px] font-mono text-gray-500 tabular-nums">
            {actions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFolder('loose')}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            selectedFolderId === 'loose'
              ? 'bg-sky-500/20 text-white border border-sky-400/40 font-semibold'
              : 'text-gray-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">
              ∅
            </span>
            <span>Soltas (Sem Pasta)</span>
          </span>
          <span className="text-[10px] font-mono text-gray-500 tabular-nums">
            {looseActionsCount}
          </span>
        </button>
      </div>

      {/* Árvore de Pastas */}
      <div className="space-y-0.5 max-h-[360px] overflow-y-auto pr-1">
        {folders.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            <p>Nenhuma pasta criada ainda.</p>
            <button
              type="button"
              onClick={() => {
                setCreateParentId(null);
                setShowCreateForm(true);
              }}
              className="mt-2 text-[#98A9FF] hover:underline cursor-pointer"
            >
              + Criar primeira pasta
            </button>
          </div>
        ) : (
          renderTree(null, 0)
        )}
      </div>
    </div>
  );
};
