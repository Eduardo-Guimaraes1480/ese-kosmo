"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import {
  Home, Flame, Store, Users, MessageSquare, Settings, Globe,
  Menu, X, ChevronRight, CheckCircle2, Circle, Plus, User,
  Shield, Zap, Target, Award, Skull, AlertTriangle, LogOut
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- MOCK DATA ---
const USER_DATA = {
  name: "DUDUGUI",
  vocation: "EXPLORADOR",
  level: 12,
  xp: 8450,
  xpNext: 10000,
  hp: 100,
  maxHp: 100,
  ese: 1250,
};

const PILLARS = [
  { name: "Physical", level: 1, progress: 85, color: "bg-purple-500" },
  { name: "Mental", level: 1, progress: 70, color: "bg-blue-400" },
  { name: "Work", level: 1, progress: 40, color: "bg-green-400" },
  { name: "Spirit", level: 1, progress: 70, color: "bg-yellow-400" },
  { name: "Social", level: 1, progress: 50, color: "bg-pink-400" },
  { name: "Etc..", level: 1, progress: 45, color: "bg-gray-400" },
];

const RADAR_DATA = [
  { subject: 'SAÚDE', A: 120, fullMark: 150 },
  { subject: 'SOCIAL', A: 98, fullMark: 150 },
  { subject: 'ESTUDOS', A: 86, fullMark: 150 },
  { subject: 'TRABALHO', A: 99, fullMark: 150 },
  { subject: 'FAMÍLIA', A: 85, fullMark: 150 },
];

const ACTIONS = [
  { id: 1, title: "Treino de Força (45min)", xp: 10, ese: 5, pillar: "Physical", completed: true },
  { id: 2, title: "Ler 20 páginas", xp: 5, ese: 0, pillar: "Mental", completed: false },
  { id: 3, title: "Reunião de Alinhamento", xp: 15, ese: 10, pillar: "Work", completed: true },
  { id: 4, title: "Meditação (10min)", xp: 5, ese: 2, pillar: "Spirit", completed: false },
  { id: 5, title: "Ligar para os pais", xp: 5, ese: 1, pillar: "Social", completed: false },
];

const ACTION_CATEGORIES = [
  { name: "DIÁRIAS", subtitle: "MAX 20 | Plano FREE", icon: <CheckCircle2 className="w-6 h-6" />, color: "text-gray-300" },
  { name: "FAZER", subtitle: "MAX 10/dia | Plano FREE", icon: <Menu className="w-6 h-6" />, color: "text-blue-400" },
  { name: "MISSÕES", subtitle: "MAX 5/mês | Plano FREE", icon: <Target className="w-6 h-6" />, color: "text-purple-400" },
  { name: "CONQUISTAS", subtitle: "MAX 3/mês | Plano FREE", icon: <Award className="w-6 h-6" />, color: "text-yellow-400" },
  { name: "BOSS", subtitle: "MAX 1/mês | Plano FREE", icon: <Skull className="w-6 h-6" />, color: "text-red-500" },
  { name: "PROBLEMAS", subtitle: "Inimigos", icon: <AlertTriangle className="w-6 h-6" />, color: "text-orange-500" },
];

// --- COMPONENTS ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-ese-gray/40 backdrop-blur-md border border-white/10 rounded-2xl p-4", className)}>
    {children}
  </div>
);

const ProgressBar = ({ progress, colorClass, heightClass = "h-2" }: { progress: number, colorClass: string, heightClass?: string }) => (
  <div className={cn("w-full bg-black/50 rounded-full overflow-hidden", heightClass)}>
    <div
      className={cn("h-full rounded-full transition-all duration-500", colorClass)}
      style={{ width: `${progress}%` }}
    />
  </div>
);

const VerticalProgressBar = ({ progress, colorClass, label, sublabel }: { progress: number, colorClass: string, label: string, sublabel: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-24 w-4 bg-black/50 rounded-full overflow-hidden relative flex items-end">
      <div
        className={cn("w-full rounded-full transition-all duration-500", colorClass)}
        style={{ height: `${progress}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10">
        {progress}%
      </span>
    </div>
    <div className="text-center">
      <div className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">{label}</div>
      <div className="text-[9px] text-gray-500">{sublabel}</div>
    </div>
  </div>
);

const Sidebar = ({ isOpen, onClose, onLogout }: { isOpen: boolean; onClose: () => void; onLogout: () => void }) => {
  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: "Home", active: true },
    { icon: <Flame className="w-5 h-5" />, label: "Ações" },
    { icon: <Store className="w-5 h-5" />, label: "Loja de Recompensas" },
    { icon: <Users className="w-5 h-5" />, label: "Minha Equipe" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Comunidade" },
    { icon: <Settings className="w-5 h-5" />, label: "Configurações" },
    { icon: <Globe className="w-5 h-5" />, label: "Ir para Rede Social" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-ese-black border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:block"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ese-blue flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-wider">SIDEBAR</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                item.active
                  ? "bg-white/10 text-white font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              {item.icon}
              <span className="text-sm tracking-wide">{item.label}</span>
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

const BottomNav = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-ese-black/90 backdrop-blur-lg border-t border-white/10 p-2 z-30 lg:hidden">
    <div className="flex justify-around items-center">
      <button className="p-3 text-ese-blue-light"><Home className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Flame className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Store className="w-6 h-6" /></button>
      <button className="p-3 text-gray-500 hover:text-gray-300"><Users className="w-6 h-6" /></button>
    </div>
  </div>
);

const CreateActionModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('diaria');
  const [pilar, setPilar] = useState('Saúde');
  const [xpReward, setXpReward] = useState(10);
  const [eseReward, setEseReward] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionTypes = [
    { id: 'diaria', label: 'DIÁRIA' },
    { id: 'fazer', label: 'FAZER' },
    { id: 'meta', label: 'MISSÕES' },
    { id: 'boss', label: 'BOSS' },
    { id: 'problema', label: 'INIMIGO' },
  ];

  const pilares = ['Saúde', 'Finanças', 'Carreira', 'Família', 'Social', 'Mente'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Correção Erro RLS: Puxar session direto do servidor de auth ao invés da prop state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      const { error: insertError } = await supabase.from('actions').insert([
        {
          user_id: session.user.id,
          title,
          type,
          xp_reward: xpReward,
          ese_reward: eseReward,
          // description: description, 
          // pilar_id: pilar, 
        }
      ]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Falha ao criar ação. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0F10] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none" />

        {/* Header Premium */}
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

        {/* Scrollable Formulário */}
        <div className="flex-1 overflow-y-auto pr-2 relative z-10 flex flex-col gap-6" style={{ scrollbarWidth: 'none' }}>

          {/* Visual Tabs (Pills de Tipo) */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Tipo de Ação</label>
            <div className="flex flex-wrap gap-2">
              {actionTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-colors border",
                    type === t.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                      : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
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

          {/* Recompensas de XP e E$E */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">XP (Máx 2500)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400 font-bold">
                  ⚡
                </div>
                <input
                  type="number"
                  min="0"
                  max="2500"
                  value={xpReward}
                  onChange={(e) => setXpReward(Math.min(2500, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block flex items-center gap-1">E$E (Máx 1000)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-yellow-400 font-bold">
                  🪙
                </div>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={eseReward}
                  onChange={(e) => setEseReward(Math.min(1000, Math.max(0, Number(e.target.value))))}
                  className="w-full bg-[#111618] border-none rounded-xl pl-9 pr-4 py-3 text-yellow-500 focus:ring-1 focus:ring-blue-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seletor Pilares */}
          <div>
            <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Pilar Kosmo</label>
            <div className="flex flex-wrap gap-2">
              {pilares.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPilar(p)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-colors border",
                    pilar === p
                      ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                      : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Botão de Save Premium */}
        <div className="pt-6 shrink-0 relative z-10 border-t border-gray-800/50 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest transition-colors flex justify-center items-center shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "SALVAR AÇÃO"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('HOME');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUserData({
          id: session.user.id,
          name: profile?.nickname || session.user.email,
          vocation: profile?.vocation || "INICIANTE",
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          xpNext: (profile?.level || 1) * 1000,
          hp: profile?.hp || 100,
          maxHp: 100,
          ese: profile?.ese_balance || 0,
        });
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-ese-black)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-ese-blue)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ese-dark to-ese-black text-ese-white flex font-sans selection:bg-ese-blue/30">

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-ese-black/50 backdrop-blur-md z-20">
          <div className="w-10 h-10 rounded-full bg-ese-gray/50 flex items-center justify-center border border-white/10">
            <User className="w-5 h-5 text-gray-300" />
          </div>
          <h1 className="font-heading font-bold text-lg tracking-widest">{activeTab}</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-8 pb-4">
          <h1 className="font-heading font-bold text-3xl tracking-widest">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-ese-blue-light">{userData?.name || USER_DATA.name}</div>
              <div className="text-xs text-gray-400">Nível {userData?.level || USER_DATA.level}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-ese-gray/80 flex items-center justify-center border border-white/20">
              <User className="w-6 h-6 text-gray-300" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 space-y-6">

          {/* PERSONA SECTION */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading font-bold text-lg tracking-widest">PERSONA</h2>
              <span className="text-xs text-gray-400 font-semibold tracking-wider">ESTATÍSTICAS</span>
            </div>
            <Card className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
              {/* Avatar Placeholder */}
              <div className="w-32 h-40 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0">
                <User className="w-16 h-16 text-gray-600" />
              </div>

              {/* Stats */}
              <div className="flex-1 w-full space-y-3 flex flex-col justify-center">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">NAME</span>
                  <span className="font-heading font-bold text-lg">{userData?.name || USER_DATA.name}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">VOCAÇÃO</span>
                  <span className="font-heading font-bold text-ese-blue-light">{userData?.vocation || USER_DATA.vocation}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">XP</span>
                  <div className="flex-1 mx-4">
                    <ProgressBar progress={((userData?.xp || USER_DATA.xp) / (userData?.xpNext || USER_DATA.xpNext)) * 100} colorClass="bg-ese-blue-light" />
                  </div>
                  <span className="font-mono text-sm">{userData?.xp || USER_DATA.xp}/{userData?.xpNext || USER_DATA.xpNext}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">PONTOS DE VIDA</span>
                  <div className="flex-1 mx-4">
                    <ProgressBar progress={((userData?.hp || USER_DATA.hp) / (userData?.maxHp || USER_DATA.maxHp)) * 100} colorClass="bg-red-500" />
                  </div>
                  <span className="font-mono text-sm">{userData?.hp || USER_DATA.hp}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <span className="text-xs text-gray-400 font-semibold tracking-wider">E$E</span>
                  <span className="font-heading font-bold text-yellow-400 text-lg">{userData?.ese || USER_DATA.ese}</span>
                </div>
              </div>
            </Card>
          </section>

          {/* SEUS PILARES */}
          <section>
            <h2 className="font-heading font-bold text-lg tracking-widest mb-3 px-1 uppercase">Seus Pilares</h2>
            <Card>
              <div className="text-xs text-gray-400 font-semibold tracking-wider mb-4">MY LIFE</div>
              <div className="flex justify-between items-end px-2 sm:px-6">
                {PILLARS.map((pillar, idx) => (
                  <VerticalProgressBar
                    key={idx}
                    progress={pillar.progress}
                    colorClass={pillar.color}
                    label={pillar.name}
                    sublabel={`NVL${pillar.level}`}
                  />
                ))}
              </div>
            </Card>
          </section>

          {/* STATUS & GRAFICO */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-heading font-bold text-lg tracking-widest mb-3 px-1 uppercase">Status</h2>
              <Card className="h-48 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <Flame className="w-12 h-12 text-orange-500 mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                <div className="font-heading font-black text-2xl tracking-widest italic text-white drop-shadow-md">OFENSIVA</div>
                <div className="font-heading font-black text-4xl text-orange-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">15 dias</div>
              </Card>
            </div>

            <div>
              <h2 className="font-heading font-bold text-lg tracking-widest mb-3 px-1 uppercase">Gráfico</h2>
              <Card className="h-48 flex items-center justify-center p-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={RADAR_DATA}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar name="Sacrifícios" dataKey="A" stroke="#4850FF" fill="#4850FF" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </section>

          {/* PRÓXIMAS AÇÕES */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-heading font-bold text-lg tracking-widest uppercase">Próximas Ações</h2>
              <button className="text-xs text-ese-blue-light font-semibold hover:text-white flex items-center">
                VER TODAS <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Action Categories Filter (Mocked) */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {['DIÁRIAS', 'FAZER', 'MISSÕES', 'CONQUISTA', 'BOSS', 'PROBLEMAS'].map((cat, i) => (
                <button
                  key={i}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-colors",
                    i === 1 ? "bg-ese-blue text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 mb-4 rounded-xl border border-dashed border-white/20 text-ese-blue-light font-bold tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> CRIE UMA NOVA AÇÃO
            </button>

            <div className="space-y-3">
              {ACTIONS.map((action) => (
                <Card key={action.id} className="p-3 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                  <button className="flex-shrink-0 text-gray-500 group-hover:text-ese-blue-light transition-colors">
                    {action.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold truncate",
                      action.completed ? "text-gray-400 line-through" : "text-white"
                    )}>
                      {action.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold tracking-wider">
                      <span className="text-ese-blue-light">XP: {action.xp}</span>
                      <span className="text-yellow-400">RECOMPENSA: {action.ese} E$E</span>
                      <span className="text-gray-500 uppercase">PILAR: {action.pillar}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* UPGRADE BANNER */}
          <section className="pt-4">
            <div className="bg-gradient-to-r from-ese-blue to-purple-600 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20 shadow-[0_0_30px_rgba(72,80,255,0.3)]">
              <div>
                <h3 className="font-heading font-black text-lg italic tracking-wider">[UPGRADE TO PRO R$ 19,99/month]</h3>
                <ul className="text-xs text-white/80 mt-1 list-disc list-inside">
                  <li>Unlimited actions in all categories</li>
                  <li>Complete Database without limit</li>
                  <li>Complete Experience without restriction</li>
                </ul>
              </div>
              <button className="w-full sm:w-auto px-6 py-2 bg-white text-ese-dark font-black tracking-widest rounded-xl hover:bg-gray-200 transition-colors">
                UPGRADE
              </button>
            </div>
          </section>

        </div>
      </main>

      {isModalOpen && (
        <CreateActionModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            alert("Ação criada com sucesso!");
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
