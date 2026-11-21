'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import {
  ActionFormPrototype,
  buildDraftTab,
} from '@/src/components/prototypes/ActionFormPrototype';
import {
  ActionDraftTab,
  ActionFolder,
  ActionItem,
  ActionType,
} from '@/src/components/prototypes/types';
import {
  deleteActionWithRelations,
  fetchActionsWithRelations,
  saveActionWithRelations,
} from '@/src/lib/actions/actionService';
import { fetchFoldersForUser } from '@/src/lib/actions/folderService';

export interface ActionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: any | null;
  initialType?: ActionType;
  initialFolderIds?: string[];
  onSuccess?: () => void;
}

export const ActionFormModal: React.FC<ActionFormModalProps> = ({
  isOpen,
  onClose,
  initialAction = null,
  initialType = 'fazer',
  initialFolderIds = [],
  onSuccess,
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [existingActions, setExistingActions] = useState<ActionItem[]>([]);
  const [folders, setFolders] = useState<ActionFolder[]>([]);
  const [tabs, setTabs] = useState<ActionDraftTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // 1. Carregar sessão do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchActionsWithRelations(session.user.id)
          .then((items) => setExistingActions(items))
          .catch((err) => console.error('Erro ao carregar ações:', err));
        fetchFoldersForUser()
          .then((f) => setFolders(f))
          .catch((err) => console.error('Erro ao carregar pastas:', err));
      }
    });
  }, []);

  // 2. Quando o modal abre ou `initialAction` muda, inicializar ou focar aba
  useEffect(() => {
    if (!isOpen) return;

    if (initialAction) {
      // Procurar se a ação já existe nos ActionItems carregados
      const matched = existingActions.find((a) => a.id === initialAction.id);
      const actionToOpen: ActionItem = matched || {
        id: initialAction.id,
        title: initialAction.title || 'Ação',
        description: initialAction.description || '',
        type: (initialAction.type || 'fazer') as ActionType,
        status: initialAction.status === 'concluido' ? 'concluido' : 'pendente',
        management_status: initialAction.management_status || 'nao_resolvido',
        pillars: initialAction.pillar ? [initialAction.pillar] : ['Geral'],
        sacrifice_priorities: initialAction.sacrifice_priority
          ? [initialAction.sacrifice_priority]
          : ['Saúde'],
        xp_reward: initialAction.xp_reward ?? 10,
        ese_reward: initialAction.ese_reward ?? 5,
        pilar_impact: initialAction.pilar_impact ?? 0.5,
        radar_impact: initialAction.radar_impact ?? 0.5,
        due_date: initialAction.due_date || '2026-11-21',
        due_time: initialAction.due_time || '21:00',
        folderIds: initialAction.folderIds || [],
        order_index: initialAction.order_index ?? 0,
        created_at: initialAction.created_at || new Date().toISOString(),
      };

      const existingTab = tabs.find((t) => t.sourceActionId === actionToOpen.id);
      if (existingTab) {
        setActiveTabId(existingTab.tabId);
      } else {
        const newTab = buildDraftTab(actionToOpen, actionToOpen.type, initialFolderIds);
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.tabId);
      }
    } else if (tabs.length === 0) {
      // Criar nova aba inicial
      const defaultTab = buildDraftTab(null, initialType, initialFolderIds);
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.tabId);
    }
  }, [isOpen, initialAction, initialType, initialFolderIds, existingActions]);

  // 3. Salvar ação no Supabase com relações
  const handleSave = async (
    _savedAction: ActionItem,
    _createdInlineFazers?: ActionItem[],
    savedTabId?: string
  ) => {
    if (!userId) return;

    const currentTab = tabs.find((t) => t.tabId === (savedTabId || activeTabId));
    if (!currentTab) return;

    try {
      const { actionId } = await saveActionWithRelations(
        userId,
        currentTab,
        currentTab.sourceActionId
      );

      // Atualizar lista de ações existentes localmente
      const updatedList = await fetchActionsWithRelations(userId);
      setExistingActions(updatedList);

      // Marcar aba como limpa e associada ao ID salvo
      setTabs((prev) =>
        prev.map((t) =>
          t.tabId === currentTab.tabId
            ? { ...t, isDirty: false, sourceActionId: actionId }
            : t
        )
      );

      onSuccess?.();
    } catch (err: any) {
      console.error('Falha ao salvar ação no Supabase:', err);
      alert(`Erro ao salvar ação: ${err?.message || 'Falha na conexão com o banco.'}`);
    }
  };

  // 4. Excluir ação no Supabase
  const handleDelete = async (actionId: string) => {
    if (!userId) return;

    try {
      await deleteActionWithRelations(userId, actionId);

      // Atualizar lista de ações existentes
      const updatedList = await fetchActionsWithRelations(userId);
      setExistingActions(updatedList);

      // Fechar a aba correspondente
      setTabs((prev) => {
        const remaining = prev.filter((t) => t.sourceActionId !== actionId);
        if (remaining.length > 0) {
          setActiveTabId(remaining[0].tabId);
        } else {
          const fresh = buildDraftTab(null, initialType);
          setActiveTabId(fresh.tabId);
          return [fresh];
        }
        return remaining;
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Falha ao excluir ação no Supabase:', err);
      alert(`Erro ao excluir ação: ${err?.message || 'Falha ao excluir.'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <ActionFormPrototype
      isOpen={isOpen}
      initialAction={null}
      initialType={initialType}
      initialFolderIds={initialFolderIds}
      existingActions={existingActions}
      folders={folders}
      tabs={tabs}
      activeTabId={activeTabId}
      onChangeTabs={setTabs}
      onChangeActiveTabId={setActiveTabId}
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
};
