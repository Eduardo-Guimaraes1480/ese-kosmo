import { supabase } from '@/src/lib/supabase';
import { ActionFolder } from '@/src/components/prototypes/types';
import { parsePlanErrorMessage } from '@/src/lib/plans/planService';

// =============================================================================
// TIPOS INTERNOS
// =============================================================================

export interface FolderItem {
  id: string;
  folder_id: string;
  action_id: string;
  user_id: string;
  order_index: number;
  created_at: string;
}

type DbFolder = {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  color: string;
  icon: string;
  order_index: number;
  created_at: string;
};

// =============================================================================
// CONVERSORES
// =============================================================================

function toActionFolder(row: DbFolder): ActionFolder {
  return {
    id: row.id,
    user_id: row.user_id,
    parent_folder_id: row.parent_folder_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    order_index: row.order_index,
    created_at: row.created_at,
  };
}

// =============================================================================
// LEITURA
// =============================================================================

/** Busca todas as pastas do usuário autenticado, ordenadas por order_index. */
export async function fetchFoldersForUser(): Promise<ActionFolder[]> {
  const { data, error } = await supabase
    .from('action_folders')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data as DbFolder[]).map(toActionFolder);
}

/** Busca todos os itens de pasta do usuário autenticado. */
export async function fetchFolderItemsForUser(): Promise<FolderItem[]> {
  const { data, error } = await supabase
    .from('action_folder_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data as FolderItem[];
}

/**
 * Dado um action_id, retorna os folder_ids onde a ação está.
 * Útil para popular o FolderAssignPopover ao abrir uma ação existente.
 */
export async function fetchFolderIdsForAction(actionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('action_folder_items')
    .select('folder_id')
    .eq('action_id', actionId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: { folder_id: string }) => row.folder_id);
}

/**
 * Dado um folder_id, retorna os action_ids dentro dele.
 */
export async function fetchActionIdsInFolder(folderId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('action_folder_items')
    .select('action_id')
    .eq('folder_id', folderId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: { action_id: string }) => row.action_id);
}

// =============================================================================
// CRIAÇÃO E EDIÇÃO DE PASTAS
// =============================================================================

export interface CreateFolderInput {
  name: string;
  color?: string;
  icon?: string;
  parent_folder_id?: string | null;
  order_index?: number;
}

/** Cria uma nova pasta. user_id é preenchido automaticamente via RLS/auth.uid(). */
export async function createFolder(
  userId: string,
  input: CreateFolderInput
): Promise<ActionFolder> {
  const payload = {
    user_id: userId,
    name: input.name.trim(),
    color: input.color ?? '#4850FF',
    icon: input.icon ?? 'folder',
    parent_folder_id: input.parent_folder_id ?? null,
    order_index: input.order_index ?? 0,
  };

  const { data, error } = await supabase
    .from('action_folders')
    .insert(payload)
    .select()
    .single();

  if (error) {
    const planErr = parsePlanErrorMessage(error);
    throw new Error(planErr.message);
  }
  return toActionFolder(data as DbFolder);
}

export interface UpdateFolderInput {
  name?: string;
  color?: string;
  icon?: string;
  order_index?: number;
}

/** Atualiza nome, cor ou ícone de uma pasta. Não move a pasta (use moveFolder). */
export async function updateFolder(
  folderId: string,
  input: UpdateFolderInput
): Promise<ActionFolder> {
  const payload: Partial<DbFolder> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.color !== undefined) payload.color = input.color;
  if (input.icon !== undefined) payload.icon = input.icon;
  if (input.order_index !== undefined) payload.order_index = input.order_index;

  const { data, error } = await supabase
    .from('action_folders')
    .update(payload)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    const planErr = parsePlanErrorMessage(error);
    throw new Error(planErr.message);
  }
  return toActionFolder(data as DbFolder);
}

/**
 * Move uma pasta para outro pai (ou para raiz se newParentId === null).
 * A prevenção de ciclos é garantida pelo trigger `trg_prevent_folder_cycle` no banco.
 * Se a operação criaria um ciclo, o Supabase lança um erro com a mensagem do trigger.
 */
export async function moveFolder(
  folderId: string,
  newParentId: string | null
): Promise<ActionFolder> {
  const { data, error } = await supabase
    .from('action_folders')
    .update({ parent_folder_id: newParentId })
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    const planErr = parsePlanErrorMessage(error);
    throw new Error(planErr.message);
  }
  return toActionFolder(data as DbFolder);
}

/** Deleta uma pasta. Cascata automática remove os itens da pasta (ações preservadas). */
export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('action_folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

// =============================================================================
// REORDENAÇÃO DE PASTAS
// =============================================================================

/**
 * Persiste a nova ordem de pastas filhas de um dado pai (ou da raiz se parentId === null).
 * Recebe os IDs na nova ordem e atualiza order_index de cada um.
 */
export async function reorderFolders(
  parentId: string | null,
  orderedFolderIds: string[]
): Promise<void> {
  const updates = orderedFolderIds.map((id, i) =>
    supabase
      .from('action_folders')
      .update({ order_index: i })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

// =============================================================================
// VÍNCULOS AÇÃO ↔ PASTA
// =============================================================================

/**
 * Vincula uma ação a uma pasta.
 * O trigger `trg_check_folder_item_user_match` garante que ambos pertencem ao mesmo usuário.
 */
export async function assignActionToFolder(
  userId: string,
  actionId: string,
  folderId: string
): Promise<void> {
  const { error } = await supabase.from('action_folder_items').insert({
    user_id: userId,
    action_id: actionId,
    folder_id: folderId,
    order_index: 0,
  });

  // UNIQUE constraint: já estava vinculado → ignorar silenciosamente
  if (error && error.code !== '23505') throw error;
}

/** Remove uma ação de uma pasta específica. */
export async function removeActionFromFolder(
  actionId: string,
  folderId: string
): Promise<void> {
  const { error } = await supabase
    .from('action_folder_items')
    .delete()
    .eq('action_id', actionId)
    .eq('folder_id', folderId);

  if (error) throw error;
}

/** Remove uma ação de TODAS as pastas. */
export async function removeActionFromAllFolders(actionId: string): Promise<void> {
  const { error } = await supabase
    .from('action_folder_items')
    .delete()
    .eq('action_id', actionId);

  if (error) throw error;
}

/**
 * Sincroniza os vínculos de uma ação com um novo conjunto de folderIds.
 * - Adiciona os que não existem
 * - Remove os que não estão mais na lista
 *
 * Esta é a função chamada pelo actionService ao salvar uma ação.
 */
export async function syncActionFolders(
  userId: string,
  actionId: string,
  newFolderIds: string[]
): Promise<void> {
  // 1 — busca vínculos atuais
  const { data: current, error: fetchErr } = await supabase
    .from('action_folder_items')
    .select('folder_id')
    .eq('action_id', actionId);

  if (fetchErr) throw fetchErr;

  const currentIds = new Set((current ?? []).map((r: { folder_id: string }) => r.folder_id));
  const nextIds = new Set(newFolderIds);

  // 2 — inserir os novos
  const toAdd = newFolderIds.filter((id) => !currentIds.has(id));
  if (toAdd.length > 0) {
    const { error: insertErr } = await supabase.from('action_folder_items').insert(
      toAdd.map((folderId, i) => ({
        user_id: userId,
        action_id: actionId,
        folder_id: folderId,
        order_index: i,
      }))
    );
    // Ignorar violações de UNIQUE (inserção duplicada)
    if (insertErr && insertErr.code !== '23505') throw insertErr;
  }

  // 3 — remover os que saíram
  const toRemove = Array.from(currentIds).filter((id) => !nextIds.has(id));
  if (toRemove.length > 0) {
    const { error: deleteErr } = await supabase
      .from('action_folder_items')
      .delete()
      .eq('action_id', actionId)
      .in('folder_id', toRemove);

    if (deleteErr) throw deleteErr;
  }
}

// =============================================================================
// REORDENAÇÃO DE AÇÕES DENTRO DE UMA PASTA
// =============================================================================

/**
 * Persiste a nova ordem das ações dentro de uma pasta.
 * Recebe os action_ids na nova ordem e atualiza order_index de cada item.
 */
export async function reorderFolderItems(
  folderId: string,
  orderedActionIds: string[]
): Promise<void> {
  const updates = orderedActionIds.map((actionId, i) =>
    supabase
      .from('action_folder_items')
      .update({ order_index: i })
      .eq('folder_id', folderId)
      .eq('action_id', actionId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

// =============================================================================
// UTILITÁRIO: CHECK DE DESCENDÊNCIA (prevenção de UI de movimentação)
// =============================================================================

/**
 * Retorna true se `potentialAncestorId` é ancestral (direto ou indireto) de `folderId`.
 * Usado para desabilitar drop em itens que criariam ciclo na UI antes de enviar ao banco.
 */
export function isFolderDescendantOf(
  folders: ActionFolder[],
  folderId: string,
  potentialAncestorId: string
): boolean {
  if (folderId === potentialAncestorId) return true;
  const visited = new Set<string>();
  let current: ActionFolder | undefined = folders.find((f) => f.id === folderId);

  while (current && !visited.has(current.id)) {
    if (current.parent_folder_id === potentialAncestorId) return true;
    visited.add(current.id);
    current = current.parent_folder_id
      ? folders.find((f) => f.id === current!.parent_folder_id)
      : undefined;
  }
  return false;
}
