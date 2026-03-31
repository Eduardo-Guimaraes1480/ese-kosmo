'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Flame, Store, Users } from 'lucide-react';

const BOTTOM_ITEMS = [
  { icon: Home,  label: 'Home',   href: '/' },
  { icon: Flame, label: 'Ações',  href: '/acoes' },
  { icon: Store, label: 'Loja',   href: '#' },
  { icon: Users, label: 'Equipe', href: '#' },
];

export const BottomNav = ({ active = '/' }: { active?: string }) => {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ese-black/90 backdrop-blur-lg border-t border-white/10 p-2 z-30 lg:hidden">
      <div className="flex justify-around items-center">
        {BOTTOM_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = active === href;
          return (
            <button
              key={label}
              onClick={() => href !== '#' && router.push(href)}
              disabled={href === '#'}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-[#98A9FF]'
                  : href === '#'
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-bold tracking-wider uppercase">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
