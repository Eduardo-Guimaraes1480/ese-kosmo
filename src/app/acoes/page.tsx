'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Store, Users, Target, Award, Skull, AlertTriangle,
  ListTodo, Database, LayoutGrid, Calendar,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Sidebar } from '@/src/components/ui/Sidebar';
import { BottomNav } from '@/src/components/ui/BottomNav';
import { Header } from '@/src/components/ui/Header';

const categories = [
  {
    id: 'todas',
    href: '/acoes/todas',
    title: 'TODAS AÇÕES',
    badge: 'VISÃO GERAL',
    description: 'Acesse suas tarefas pendentes, diárias, missões e objetivos atuais.',
    tags: 'DIÁRIAS · FAZER · MISSÕES',
    icon: LayoutGrid,
    theme: {
      iconBox: 'bg-[#4850FF]/10 border-[#4850FF]/20 group-hover:bg-[#4850FF]/20',
      icon: 'text-[#4850FF]',
      badge: 'bg-[#4850FF]/10 text-[#98A9FF] border-[#4850FF]/20',
      hoverBorder: 'hover:border-[#4850FF]/40',
    },
  },
  {
    id: 'diarias',
    href: '/acoes/diaria',
    title: 'DIÁRIAS (Tasks)',
    badge: 'MAX 20 | FREE',
    description: 'Tarefas recorrentes para manter sua ofensiva e consistência diária.',
    tags: 'RESET DIÁRIO · OFENSIVA',
    icon: Calendar,
    theme: {
      iconBox: 'bg-slate-500/10 border-slate-500/20 group-hover:bg-slate-500/20',
      icon: 'text-slate-400',
      badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      hoverBorder: 'hover:border-slate-500/40',
    },
  },
  {
    id: 'fazer',
    href: '/acoes/fazer',
    title: 'FAZER (Req.)',
    badge: 'MAX 10/DIA',
    description: 'Requisitos únicos que desaparecem no fim do dia determinado.',
    tags: 'URGENTE · PONTUAL',
    icon: ListTodo,
    theme: {
      iconBox: 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20',
      icon: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/40',
    },
  },
  {
    id: 'missoes',
    href: '/acoes/meta',
    title: 'MISSÕES (Metas)',
    badge: 'MAX 5/MÊS',
    description: 'Metas de médio prazo que desaparecem no fim do mês determinado.',
    tags: 'ALTO XP · PLANEJAMENTO',
    icon: Target,
    theme: {
      iconBox: 'bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20',
      icon: 'text-purple-400',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/40',
    },
  },
  {
    id: 'conquistas',
    href: '/acoes/conquista',
    title: 'CONQUISTAS',
    badge: 'MAX 3/MÊS',
    description: 'Marcos importantes, criados manualmente ou AUTO pelo seu Nível.',
    tags: 'RECOMPENSAS · MARCOS',
    icon: Award,
    theme: {
      iconBox: 'bg-yellow-500/10 border-yellow-500/20 group-hover:bg-yellow-500/20',
      icon: 'text-yellow-400',
      badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      hoverBorder: 'hover:border-yellow-500/40',
    },
  },
  {
    id: 'boss',
    href: '/acoes/boss',
    title: 'BOSS (Objetivos)',
    badge: 'MAX 1/MÊS',
    description: 'O grande objetivo do mês. Derrote-o antes do prazo para não perder HP.',
    tags: 'RISCO DE HP · ÉPICO',
    icon: Skull,
    theme: {
      iconBox: 'bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20',
      icon: 'text-orange-400',
      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
      hoverBorder: 'hover:border-orange-500/40',
    },
  },
  {
    id: 'problemas',
    href: '/acoes/problema',
    title: 'PROBLEMAS',
    badge: 'MAX 10/DIA',
    description: 'Imprevistos e inimigos diários. Resolva o quanto antes para evitar dano.',
    tags: 'PENALIDADE · URGENTE',
    icon: AlertTriangle,
    theme: {
      iconBox: 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20',
      icon: 'text-red-400',
      badge: 'bg-red-500/10 text-red-300 border-red-500/20',
      hoverBorder: 'hover:border-red-500/40',
    },
  },
  {
    id: 'banco',
    href: '/acoes/historico',
    title: 'BANCO DE DADOS',
    badge: 'HISTÓRICO',
    description: 'Acesse o histórico completo de todas as ações que você já concluiu.',
    tags: 'REGISTROS · PROGRESSO',
    icon: Database,
    theme: {
      iconBox: 'bg-gray-500/10 border-gray-500/20 group-hover:bg-gray-500/20',
      icon: 'text-gray-400',
      badge: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      hoverBorder: 'hover:border-gray-500/40',
    },
  },
];

export default function AcoesHub() {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => router.push('/login');

  return (
    <div className="flex h-screen bg-[#0B0F10] text-[#FEFEFE] font-sans selection:bg-[#4850FF]/30 overflow-hidden">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">

        <Header
          title="AÇÕES"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8" style={{ scrollbarWidth: 'none' }}>
          <p className="text-gray-500 text-sm mb-6 px-1">
            Escolha onde ir — gerencie suas missões ou consulte seu histórico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => router.push(cat.href)}
                  className={cn(
                    'bg-[#111618] border border-white/5 rounded-2xl p-5 flex flex-col transition-all duration-300 text-left group h-full',
                    'hover:-translate-y-0.5 hover:bg-[#151b1e]',
                    cat.theme.hoverBorder
                  )}
                >
                  <div className="flex items-start justify-between w-full mb-5">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-colors', cat.theme.iconBox)}>
                      <Icon className={cn('w-6 h-6', cat.theme.icon)} />
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border', cat.theme.badge)}>
                      {cat.badge}
                    </span>
                  </div>

                  <div className="flex-1 w-full">
                    <h3 className="font-sans font-black text-base tracking-widest uppercase text-white mb-2">
                      {cat.title}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed group-hover:text-gray-300 transition-colors">
                      {cat.description}
                    </p>
                  </div>

                  <div className="text-[9px] text-gray-600 font-bold tracking-widest uppercase mt-auto pt-4 border-t border-white/5 w-full">
                    {cat.tags}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 bg-[#111618] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Suas ações pendentes e concluídas estão separadas para manter o foco no que importa agora.
            </p>
          </div>
        </main>
      </div>

      <BottomNav active="/acoes" />
    </div>
  );
}
