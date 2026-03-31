'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';

export const CreateActionModal = ({
  onClose,
  onSuccess,
  pillars,
}: {
  onClose: () => void;
  onSuccess: () => void;
  pillars: any[];
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('diaria');
  const [pilar, setPilar] = useState(pillars[0]?.name || 'Geral');
  const [sacrificePriority, setSacrificePriority] = useState('Saúde');
  const [xpReward, setXpReward] = useState(10);
  const [eseReward, setEseReward] = useState(5);
  const [pilarImpact, setPilarImpact] = useState<number | string>(0.5);
  const [radarImpact, setRadarImpact] = useState<number | string>(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionTypes = [
    { id: 'diaria', label: 'DIÁRIA' },
    { id: 'fazer', label: 'FAZER' },
    { id: 'meta', label: 'MISSÕES' },
    { id: 'boss', label: 'BOSS' },
    { id: 'problema', label: 'INIMIGO' },
  ];

  const priorities = ['Saúde', 'Família', 'Social', 'Trabalho', 'Estudos'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const payload: any = {
        user_id: session.user.id,
        title,
        type,
        pillar: pilar,
        sacrifice_priority: sacrificePriority,
        xp_reward: parseInt(xpReward.toString(), 10) || 0,
        ese_reward: parseInt(eseReward.toString(), 10) || 0,
        pilar_impact: parseFloat(pilarImpact.toString()) || 0,
        radar_impact: parseFloat(radarImpact.toString()) || 0,
      };

      if (description) payload.description = description;

      const { error: insertError } = await supabase.from('actions').insert([payload]);
      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao criar ação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

        <div className="flex justify-between items-center mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4">
          <div className="w-8" />
          <h2 className="font-sans font-bold text-lg tracking-widest text-white text-center">CRIAR AÇÕES</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 relative z-10 flex flex-col gap-6" style={{ scrollbarWidth: 'none' }}>
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Tipo de Ação</label>
            <div className="flex flex-wrap gap-2">
              {actionTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-colors border',
                    type === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                      : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Título da Ação</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: Correr 5km pela manhã"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Descrição (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Detalhes ou passos necessários..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">XP (Máx 2500)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400 font-bold">⚡</div>
                <input
                  type="number" min="0" max="2500" value={xpReward}
                  onChange={(e) => setXpReward(Math.min(2500, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">E$E (Máx 1000)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-yellow-400 font-bold">🪙</div>
                <input
                  type="number" min="0" max="1000" value={eseReward}
                  onChange={(e) => setEseReward(Math.min(1000, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-yellow-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Impacto Pilar (%)</label>
              <input
                type="number" step="0.1" min="0" max="100" value={pilarImpact}
                onChange={(e) => setPilarImpact(e.target.value)}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Avanço Radar (%)</label>
              <input
                type="number" step="0.1" min="0" max="100" value={radarImpact}
                onChange={(e) => setRadarImpact(e.target.value)}
                className="w-full bg-[#111618] border-none rounded-xl px-4 py-3 text-purple-400 focus:ring-1 focus:ring-purple-500 outline-none font-bold transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Pilar Kosmo</label>
              <div className="flex flex-wrap gap-2">
                {pillars.length === 0 ? (
                  <span className="text-xs text-red-500 font-semibold italic">Pilares não configurados.</span>
                ) : (
                  pillars.map((p) => (
                    <button
                      key={p.name} type="button" onClick={() => setPilar(p.name)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors border',
                        pilar === p.name
                          ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                          : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white'
                      )}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Prioridade Gráfico</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p} type="button" onClick={() => setSacrificePriority(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors border',
                      sacrificePriority === p
                        ? 'bg-purple-600 text-white border-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                        : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 shrink-0 relative z-10 border-t border-gray-800/50 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : 'SALVAR AÇÃO'}
          </button>
        </div>
      </div>
    </div>
  );
};
