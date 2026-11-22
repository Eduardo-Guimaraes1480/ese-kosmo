'use client';

import React from 'react';
import { X, Check, Zap, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { PlanType } from '@/src/types/ese-kosmo';

export interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PlanType;
  reason?: string;
  blockedFeature?: string;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'free',
  reason,
  blockedFeature,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0B0F10] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-white/10 bg-gradient-to-r from-[#01055B]/40 via-purple-950/20 to-transparent flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#4850FF]/20 text-[#98A9FF] border border-[#4850FF]/30">
                Planos & Capacidades
              </span>
              <span className="text-xs text-gray-400">
                Seu plano atual: <strong className="text-white uppercase">{currentPlan}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-heading">
              EVOLUA SUA JORNADA NO KOSMO
            </h2>
            {reason && (
              <p className="mt-2 text-xs sm:text-sm text-yellow-400/90 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5 inline-block">
                ⚠️ {reason}
              </p>
            )}
            {blockedFeature && !reason && (
              <p className="mt-2 text-xs sm:text-sm text-blue-300 bg-[#4850FF]/15 border border-[#4850FF]/30 rounded-xl px-3 py-1.5 inline-block">
                🚀 O recurso <strong className="text-white">{blockedFeature}</strong> faz parte dos planos Pro e Ultra.
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* PLANO FREE */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                currentPlan === 'free'
                  ? 'bg-white/[0.04] border-white/20 ring-1 ring-white/10'
                  : 'bg-white/[0.02] border-white/10 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Iniciante
                  </span>
                  {currentPlan === 'free' && (
                    <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-semibold">
                      Atual
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">FREE</h3>
                <div className="text-2xl font-black text-white mb-4">
                  R$ 0<span className="text-xs text-gray-400 font-normal"> / sempre</span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>20 Diárias ativas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>10 Ações Fazer / dia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>5 Metas / mês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>1 Boss / mês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>10 Problemas / dia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>10 Pastas organizacionais</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <Check className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span>Histórico de 15 ações</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={currentPlan === 'free'}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-400 bg-white/5 border border-white/10 cursor-default"
                >
                  {currentPlan === 'free' ? 'Seu Plano Atual' : 'Plano Básico'}
                </button>
              </div>
            </div>

            {/* PLANO PRO (Destaque) */}
            <div
              className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all bg-gradient-to-b from-[#01055B]/60 to-[#0B0F10] border-[#4850FF]/60 shadow-[0_0_30px_rgba(72,80,255,0.2)] ${
                currentPlan === 'pro' ? 'ring-2 ring-[#4850FF]' : ''
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4850FF] text-white text-[10px] font-black uppercase tracking-wider py-0.5 px-3 rounded-full shadow-md flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> MAIS POPULAR
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-xs font-bold text-[#98A9FF] uppercase tracking-widest">
                    Produtividade Total
                  </span>
                  {currentPlan === 'pro' && (
                    <span className="text-[10px] bg-[#4850FF]/30 text-[#98A9FF] border border-[#4850FF]/50 px-2 py-0.5 rounded-full font-semibold">
                      Atual
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">PRO</h3>
                <div className="text-2xl font-black text-white mb-4">
                  R$ 19,99<span className="text-xs text-gray-400 font-normal"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-200">
                  <li className="flex items-start gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Todas as ações ILIMITADAS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Pastas e subpastas infinitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Banco de Dados completo (sem limite de 15)</span>
                  </li>
                  <li className="flex items-start gap-2 text-[#98A9FF]">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Pomodoro integrado</span>
                  </li>
                  <li className="flex items-start gap-2 text-[#98A9FF]">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Multiplicador Boost x1.5</span>
                  </li>
                  <li className="flex items-start gap-2 text-[#98A9FF]">
                    <Check className="w-4 h-4 text-[#98A9FF] flex-shrink-0 mt-0.5" />
                    <span>Registro de Humor & Foco</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => alert('A integração direta com Stripe estará disponível em breve! Em ambiente de desenvolvimento/teste, seu plano pode ser atualizado via procedimento administrativo.')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-[#4850FF] hover:bg-[#0008AE] transition-all shadow-[0_0_15px_rgba(72,80,255,0.4)] flex items-center justify-center gap-1.5"
                >
                  {currentPlan === 'pro' ? 'Plano Atual Ativo' : 'Escolher Pro'}
                  {currentPlan !== 'pro' && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* PLANO ULTRA */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all bg-gradient-to-b from-purple-950/40 to-[#0B0F10] border-purple-500/40 ${
                currentPlan === 'ultra' ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Máximo Potencial
                  </span>
                  {currentPlan === 'ultra' && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-semibold">
                      Atual
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">ULTRA</h3>
                <div className="text-2xl font-black text-white mb-4">
                  R$ 39,99<span className="text-xs text-gray-400 font-normal"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-200">
                  <li className="flex items-start gap-2 font-semibold text-purple-300">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Tudo do Plano Pro incluído</span>
                  </li>
                  <li className="flex items-start gap-2 font-bold text-white">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>IA integrada no Dashboard (Claude API)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Análise preditiva de consistência</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Sugestões automáticas de quebra de metas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Badge e perfil Ultra destacado</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => alert('A integração direta com Stripe estará disponível em breve! Em ambiente de desenvolvimento/teste, seu plano pode ser atualizado via procedimento administrativo.')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-1.5"
                >
                  {currentPlan === 'ultra' ? 'Plano Atual Ativo' : 'Escolher Ultra'}
                  {currentPlan !== 'ultra' && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé Seguro / Compliance */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs text-gray-400">
            <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span>
              <strong>Arquitetura Segura:</strong> As validações de limites são executadas no PostgreSQL (Supabase RLS & Triggers). A cobrança oficial Stripe será conectada na fase de produção.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
