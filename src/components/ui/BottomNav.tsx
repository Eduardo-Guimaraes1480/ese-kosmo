'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Flame, Plus, Store, Users } from 'lucide-react';

export const BottomNav = ({
  active = '/',
  onActionClick,
}: {
  active?: string;
  onActionClick?: () => void;
}) => {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ese-black/90 backdrop-blur-lg border-t border-white/10 p-2 z-30 lg:hidden">
      <div className="flex justify-around items-center">
        {/* Home */}
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
            active === '/' ? 'text-[#98A9FF]' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Home</span>
        </button>

        {/* Ações */}
        <button
          onClick={() => router.push('/acoes')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
            active.startsWith('/acoes') ? 'text-[#98A9FF]' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Ações</span>
        </button>

        {/* Botão Central de Ação */}
        <button
          onClick={() => (onActionClick ? onActionClick() : router.push('/acoes/todas'))}
          className="w-11 h-11 -mt-5 rounded-full bg-[#4850FF] hover:bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(72,80,255,0.4)] border border-[#4850FF]/40 active:scale-95 transition-all cursor-pointer"
          title="Criar Ação"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Loja */}
        <button
          disabled
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-gray-600 cursor-not-allowed"
        >
          <Store className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Loja</span>
        </button>

        {/* Equipe */}
        <button
          disabled
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-gray-600 cursor-not-allowed"
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Equipe</span>
        </button>
      </div>
    </div>
  );
};
