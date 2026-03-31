'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export const EditProfileModal = ({
  onClose,
  onSuccess,
  userData,
}: {
  onClose: () => void;
  onSuccess: (payload: any) => void;
  userData: any;
}) => {
  const [nickname, setNickname] = useState(userData?.name || userData?.nickname || '');
  const [vocation, setVocation] = useState(userData?.vocation || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) { setError('Nickname é obrigatório'); return; }
    setLoading(true);
    setError(null);

    try {
      const payload = { nickname, vocation };
      const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', userData.id);
      if (updateError) throw updateError;
      onSuccess(payload);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <h2 className="text-sm text-ese-blue-light font-bold tracking-widest uppercase mb-1 block">EDITAR PERSONA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 space-y-4 relative z-10">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nickname</label>
            <input
              type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light transition-colors"
              placeholder="Ex: Zero, Kakaroto..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Vocação</label>
            <input
              type="text" value={vocation} onChange={(e) => setVocation(e.target.value)}
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light transition-colors"
              placeholder="Ex: Desenvolvedor, Atleta..."
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col gap-3 shrink-0 relative z-10">
          <button
            onClick={handleUpdate} disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SALVANDO...' : 'SALVAR PERSONA'}
          </button>
        </div>
      </div>
    </div>
  );
};
