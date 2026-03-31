'use client';
import React, { useState } from 'react';
import { X, Globe, Trash2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export const ActionDetailsModal = ({
  onClose,
  onSuccess,
  onDelete,
  action,
  pillars,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
  action: any;
  pillars: any[];
}) => {
  const [title, setTitle] = useState(action.title || '');
  const [description, setDescription] = useState(action.description || '');
  const [type, setType] = useState(action.type || 'diaria');
  const [pilar, setPilar] = useState(action.pillar || action.pilar_id || pillars[0]?.name || 'Geral');
  const [sacrificePriority, setSacrificePriority] = useState(action.sacrifice_priority || 'Saúde');
  const [xpReward, setXpReward] = useState<number | string>(action.xp_reward || 0);
  const [eseReward, setEseReward] = useState<number | string>(action.ese_reward || 0);
  const [pilarImpact, setPilarImpact] = useState<number | string>(action.pilar_impact || 0.5);
  const [radarImpact, setRadarImpact] = useState<number | string>(action.radar_impact || 0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorities = ['Saúde', 'Família', 'Social', 'Trabalho', 'Estudos'];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        title, type,
        pillar: pilar,
        sacrifice_priority: sacrificePriority,
        xp_reward: parseInt(xpReward.toString(), 10) || 0,
        ese_reward: parseInt(eseReward.toString(), 10) || 0,
        pilar_impact: parseFloat(pilarImpact.toString()) || 0,
        radar_impact: parseFloat(radarImpact.toString()) || 0,
        description,
      };

      const { error: updateError } = await supabase.from('actions').update(payload).eq('id', action.id);
      if (updateError) throw updateError;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao atualizar ação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja deletar esta ação? Esta operação não pode ser desfeita.')) return;
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('actions').delete().eq('id', action.id);
      if (deleteError) throw deleteError;
      onDelete?.();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao deletar ação.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col my-auto max-h-[90vh]">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <span className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-1 block">Detalhes da Missão</span>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-none text-2xl font-black text-white focus:outline-none focus:ring-0 p-0 m-0 placeholder-gray-600"
              placeholder="Título da Ação"
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 relative z-10">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Descrição Detalhada</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes, notas ou checklists..."
              className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-ese-blue-light transition-colors resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Pilar KOSMO</label>
                <select
                  value={pilar} onChange={(e) => setPilar(e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none truncate"
                >
                  {pillars.length === 0 ? (
                    <option value="">Sem Pilares</option>
                  ) : (
                    pillars.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Grau Impacto / Radar</label>
                <select
                  value={sacrificePriority} onChange={(e) => setSacrificePriority(e.target.value)}
                  className="w-full bg-[#0d1315] border border-purple-500/20 rounded-xl p-3 text-sm font-bold text-purple-200 focus:outline-none focus:border-purple-500 appearance-none drop-shadow-[0_0_8px_rgba(147,51,234,0.1)]"
                >
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tipo</label>
              <select
                value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none"
              >
                <option value="diaria">DIÁRIA</option>
                <option value="fazer">FAZER</option>
                <option value="meta">META</option>
                <option value="boss">BOSS</option>
                <option value="problema">INIMIGO</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-2">Recompensas e Impacto</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-blue-400 flex items-center gap-1">⚡ POTENCIAL XP</label>
                <input type="number" value={xpReward} onChange={(e) => setXpReward(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-yellow-500 flex items-center gap-1">🪙 CRÉDITOS E$E</label>
                <input type="number" value={eseReward} onChange={(e) => setEseReward(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black tracking-widest text-green-400 flex items-center gap-1">📈 IMPACTO PILAR %</label>
                <input type="number" step="0.1" value={pilarImpact} onChange={(e) => setPilarImpact(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-green-500" />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black tracking-widest text-purple-400 flex items-center gap-1">📊 AVANÇO RADAR %</label>
                <input type="number" step="0.1" value={radarImpact} onChange={(e) => setRadarImpact(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-center font-black text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Ferramentas de Missão (Em Breve)</label>
            <div className="grid grid-cols-4 gap-2">
              {[{ e: '⏱️', l: 'Pomodoro' }, { e: '🎭', l: 'Humor' }, { e: '🚀', l: 'Boost x1.5' }, { e: '📊', l: 'Impacto' }].map(b => (
                <button key={b.l} disabled className="p-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed">
                  <span className="text-lg">{b.e}</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">{b.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col gap-3 shrink-0 relative z-10">
          <button
            onClick={handleUpdate} disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(0,8,174,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
          </button>
          <button
            onClick={() => console.log('Compartilhar na rede social')}
            className="w-full py-3 bg-transparent border border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold tracking-widest transition-all text-sm flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" /> COMPARTILHAR NA REDE SOCIAL
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold tracking-widest transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" /> DELETAR AÇÃO
          </button>
        </div>
      </div>
    </div>
  );
};
