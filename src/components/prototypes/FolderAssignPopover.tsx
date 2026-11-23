import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, Folder, Check, Layers } from 'lucide-react';
import { ActionFolder } from './types';
import { flattenFoldersWithDepth } from './folderUtils';

export interface FolderAssignPopoverProps {
  folders: ActionFolder[];
  selectedFolderIds: string[];
  onChangeFolderIds: (nextFolderIds: string[]) => void;
  buttonLabel?: string;
  align?: 'left' | 'right';
  compact?: boolean;
}

export const FolderAssignPopover: React.FC<FolderAssignPopoverProps> = ({
  folders,
  selectedFolderIds,
  onChangeFolderIds,
  buttonLabel,
  align = 'right',
  compact = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const flatFolders = flattenFoldersWithDepth(folders);
  const isLoose = selectedFolderIds.length === 0;

  const toggleFolder = (folderId: string) => {
    if (selectedFolderIds.includes(folderId)) {
      onChangeFolderIds(selectedFolderIds.filter((id) => id !== folderId));
    } else {
      onChangeFolderIds([...selectedFolderIds, folderId]);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Organizar em múltiplas pastas"
        aria-label="Organizar em múltiplas pastas"
        className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${
          selectedFolderIds.length > 0
            ? 'bg-[#4850FF]/15 border-[#4850FF]/40 text-[#98A9FF] hover:bg-[#4850FF]/25 hover:text-white'
            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <FolderPlus className={compact ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        {buttonLabel && <span className="font-semibold truncate max-w-[140px]">{buttonLabel}</span>}
        {selectedFolderIds.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-[#4850FF] text-white text-[9px] font-black tabular-nums">
            {selectedFolderIds.length}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-1.5 z-50 w-64 sm:w-72 bg-[#121619] border border-white/15 rounded-xl shadow-2xl p-2 space-y-1 max-h-72 overflow-y-auto ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-2 py-1 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#98A9FF]">
              Vincular Pastas ({selectedFolderIds.length})
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChangeFolderIds([])}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
              isLoose
                ? 'bg-sky-500/20 text-white border border-sky-400/40'
                : 'text-gray-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  isLoose
                    ? 'bg-sky-500 border-sky-400 text-white'
                    : 'bg-black/40 border-white/20'
                }`}
              >
                {isLoose && <Check className="w-3 h-3" />}
              </span>
              <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold truncate">Solta (Sem pasta)</span>
            </span>
          </button>

          <div className="pt-1 border-t border-white/5 space-y-0.5">
            {flatFolders.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic px-2 py-2 text-center">
                Nenhuma pasta criada ainda.
              </p>
            ) : (
              flatFolders.map(({ folder, depth }) => {
                const checked = selectedFolderIds.includes(folder.id);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    style={{ paddingLeft: `${10 + depth * 14}px` }}
                    className={`w-full flex items-center justify-between gap-2 pr-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#4850FF]/20 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-[#4850FF] border-[#98A9FF] text-white'
                            : 'bg-black/40 border-white/20'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                      <span className="shrink-0 flex items-center" style={{ color: folder.color }}>
                        <Folder className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate font-medium">{folder.name}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
