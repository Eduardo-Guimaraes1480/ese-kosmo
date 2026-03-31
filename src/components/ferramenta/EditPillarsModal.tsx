'use client';
import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export const EditPillarsModal = ({
  onClose,
  onSuccess,
  userData,
  currentPillars,
}: {
  onClose: () => void;
  onSuccess: () => void;
  userData: any;
  currentPillars: any[];
}) => {
  const [pillars, setPillars] = useState<any[]>(currentPillars || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    { label: 'Azul Kosmo', value: 'bg-ese-blue-light' },
    { label: 'Roxo', value: 'bg-purple-500' },
    { label: 'Azul', value: 'bg-blue-500' },
    { label: 'Verde', value: 'bg-green-500' },
    { label: 'Amarelo', value: 'bg-yellow-500' },
    { label: 'Laranja', value: 'bg-orange-500' },
    { label: 'Vermelho', value: 'bg-red-500' },
    { label: 'Rosa', value: 'bg-pink-500' },
    { label: 'Ciano', value: 'bg-cyan-500' },
  ];

  const handleAddPillar = () => {
    if (pillars.length >= 6) { setError('Você atingiu o limite de 6 pilares.'); return; }
    setError(null);
    setPillars([...pillars, { name: '', color: 'bg-ese-blue-light', progress: 0, level: 1 }]);
  };

  const handleRemovePillar = (index: number) => {
    const newPillars = [...pillars];
    newPillars.splice(index, 1);
    setPillars(newPillars);
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newPillars = [...pillars];
    newPillars[index] = { ...newPillars[index], [field]: value };
    setPillars(newPillars);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.from('pillars').delete().eq('user_id', userData.id);
      const toInsert = pillars.map(p => ({
        user_id: userData.id,
        name: p.name || 'Pilar Sem Nome',
        color: p.color,
        progress: p.progress || 0,
        level: p.level || 1,
      }));
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('pillars').insert(toInsert);
        if (insertError) throw insertError;
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Falha ao salvar pilares. Verifique se a tabela 'pillars' existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-4 shrink-0 border-b border-gray-800/50 pb-4 mt-2">
          <div className="flex-1 mr-4">
            <h2 className="text-sm text-ese-blue-light font-bold tracking-widest uppercase mb-1 block">CONFIGURAR PILARES</h2>
            <p className="text-xs text-gray-500">Defina até 6 pilares que representam os setores vitais da sua vida.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-semibold">{error}</div>}

          {pillars.map((p, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-white/5 border border-white/10 rounded-xl items-end relative">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nome do Pilar</label>
                <input
                  type="text" value={p.name} onChange={(e) => handleChange(idx, 'name', e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light"
                  placeholder="Ex: Saúde, Trabalho..." maxLength={15}
                />
              </div>
              <div className="w-full sm:w-32 space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Cor</label>
                <select
                  value={p.color} onChange={(e) => handleChange(idx, 'color', e.target.value)}
                  className="w-full bg-[#0d1315] border border-white/5 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-ese-blue-light appearance-none"
                >
                  {colors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleRemovePillar(idx)}
                className="h-11 w-12 flex flex-shrink-0 items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"
                title="Excluir Pilar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {pillars.length < 6 && (
            <button
              onClick={handleAddPillar}
              className="w-full py-4 bg-transparent border border-dashed border-white/20 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl font-bold tracking-widest transition-all text-sm flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> ADICIONAR PILAR ({pillars.length}/6)
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800/50 flex flex-col shrink-0">
          <button
            onClick={handleSave} disabled={loading}
            className="w-full py-4 bg-ese-blue hover:bg-blue-600 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SALVANDO...' : 'SALVAR PILARES'}
          </button>
        </div>
      </div>
    </div>
  );
};
