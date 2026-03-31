'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Flame, Store, Users, MessageSquare, Settings, Globe, X, LogOut,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Flame, label: 'Ações', href: '/acoes' },
  { icon: Store, label: 'Loja de Recompensas', href: '#' },
  { icon: Users, label: 'Minha Equipe', href: '#' },
  { icon: MessageSquare, label: 'Comunidade', href: '#' },
  { icon: Settings, label: 'Configurações', href: '#' },
  { icon: Globe, label: 'Ir para Rede Social', href: '#' },
];

export const Sidebar = ({
  isOpen,
  onClose,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}) => {
  const router = useRouter();

  const handleNav = (href: string) => {
    if (href === '#') return;
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-ese-black border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'lg:static lg:block'
        )}
      >
        <div className="p-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/image/ese-kosmo-logoPNG.png"
                alt="ESE Kosmo"
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className="font-sans font-black text-base tracking-widest uppercase text-white">ESE Kosmo</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <button
              key={label}
              onClick={() => handleNav(href)}
              disabled={href === '#'}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200',
                href === '#'
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm tracking-wide">{label}</span>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm tracking-wide">Sair</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/5 text-xs text-gray-500 space-y-2">
          <a href="#" className="block hover:text-gray-300">Termos de Uso</a>
          <a href="#" className="block hover:text-gray-300">Privacidade</a>
          <div className="pt-4">ESE Productions 2026</div>
        </div>
      </aside>
    </>
  );
};
