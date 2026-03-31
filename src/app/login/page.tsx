"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();

    // false = login, true = signup
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) throw signUpError;

                // Se o signup for bem sucedido, redirecionamos. Note que com e-mail confirmation habilitado, 
                // o usuário precisaria validar o e-mail primeiro. Sem confirmação obrigatória, já loga direto.
                await supabase.auth.getSession();
                setTimeout(() => {
                    router.push('/');
                }, 300);
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                await supabase.auth.getSession();
                setTimeout(() => {
                    router.push('/');
                }, 300);
            }
        } catch (err: any) {
            // Logs sensíveis ou específicos devem ficar restritos ao console/servidor
            console.error('Auth error:', err);

            // Exibir apenas mensagem genérica para o usuário final
            setError(
                isSignUp
                    ? 'Não foi possível realizar o cadastro. Verifique os dados informados.'
                    : 'E-mail ou senha incorretos. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-ese-black)] flex items-center justify-center p-4">
            {/* Container com glassmorphism */}
            <div className="w-full max-w-md bg-[rgba(30,10,64,0.3)] backdrop-blur-md border border-[var(--color-ese-purple)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                {/* Efeito luminoso de fundo */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--color-ese-blue)] rounded-full mix-blend-screen filter blur-[100px] opacity-30 pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[var(--color-ese-darker)] rounded-full mix-blend-screen filter blur-[100px] opacity-30 pointer-events-none" />

                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-heading font-bold text-[var(--color-ese-white)] mb-2 tracking-wide">ESE KOSMO</h1>
                    <p className="text-[var(--color-ese-blue-light)] text-sm">Organize suas missões, evolua seu nível.</p>
                </div>

                {/* Toggle Login/Sign Up */}
                <div className="flex bg-[rgba(11,15,16,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-full p-1 mb-8 relative z-50">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsSignUp(false);
                            setError(null);
                        }}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300 touch-manipulation ${!isSignUp ? 'bg-[var(--color-ese-blue)] text-white shadow-[0_0_15px_rgba(72,80,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsSignUp(true);
                            setError(null);
                        }}
                        className={`cursor-pointer flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300 touch-manipulation ${isSignUp ? 'bg-[var(--color-ese-blue)] text-white shadow-[0_0_15px_rgba(72,80,255,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {/* Formulário (Protegido e Separado dos Toggles) */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-4">
                        {/* Input E-mail */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Seu e-mail espacial"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-[rgba(11,15,16,0.5)] border border-[rgba(255,255,255,0.05)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-ese-blue)] focus:ring-1 focus:ring-[var(--color-ese-blue)] transition-all"
                            />
                        </div>

                        {/* Input Senha */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Sua senha secreta"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-[rgba(11,15,16,0.5)] border border-[rgba(255,255,255,0.05)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-ese-blue)] focus:ring-1 focus:ring-[var(--color-ese-blue)] transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-[var(--color-ese-accent)] hover:bg-[#343cc7] text-white rounded-full font-medium transition-colors shadow-[0_0_15px_rgba(72,80,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        style={{ backgroundColor: 'var(--color-ese-blue)' }}
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (isSignUp ? 'Iniciar Jornada' : 'Acessar Kosmo')}
                    </button>
                </form>
            </div>
        </div>
    );
}
