"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CourseHeader from "@/components/CourseHeader";
import ProgressDash from "@/components/ProgressDash";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import RankingWidget from "@/components/Ranking/RankingWidget";
import { Play, GraduationCap, Zap, Loader2 } from "lucide-react";
import ValidadorAula from "@/components/ValidadorAula";
import { Video } from "lucide-react";

export default function DashboardPrincipal() {
  const router = useRouter();
  const [userName, setUserName] = useState("Condutor");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progressoSalvo, setProgressoSalvo] = useState<string[]>([]);
  const [aulaAtiva, setAulaAtiva] = useState(false);
  const [linkAula, setLinkAula] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [avisoAula, setAvisoAula] = useState(false);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [alunoId, setAlunoId] = useState("");


  // 1. VERIFICAR SE O USUARIO ESTÁ LOGADO (só para alunos, admin tem livre)
// Verificação de sessão movida para CourseHeader (Global Guard)

// Heartbeat movido para o CourseHeader para funcionar em todas as páginas do aluno

 // 2. CANAL REALTIME PARA AULA (Versão Corrigida)
  useEffect(() => {
    const canal = supabase
      .channel('monitor-aula')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'configuracoes',
          filter: 'chave=eq.aula_ao_vivo' // Foca apenas na chave da aula
        },
        (payload) => {
          const { valor, link } = payload.new as { valor: string; link?: string };
          const ativo = String(valor) === 'true';
          
          setAulaAtiva(ativo);
          setLinkAula(link || "");

          if (ativo) {
            setAvisoAula(true);
            setTimeout(() => setAvisoAula(false), 8000);
          } else {
            setMostrarModal(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);
  
  // Backup: Poll para verificar aula a cada 5 segundos
  useEffect(() => {
    const verificarAula = async () => {
      const { data } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('chave', 'aula_ao_vivo')
        .maybeSingle();

      if (data) {
        const ativo = String(data.valor) === 'true';
        setAulaAtiva(ativo);
        setLinkAula(ativo && data.link ? data.link : "");
      }
    };

    verificarAula();
    const pollInterval = setInterval(verificarAula, 5000);

    return () => clearInterval(pollInterval);
  }, []);
  // 3. CARREGAMENTO INICIAL
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      const userId = localStorage.getItem("user-id");
      const savedName = localStorage.getItem("user-name");

      if (!userId) {
        router.push("/");
        return;
      }

      // Popula o alunoId para o ValidadorAula usar na presença biométrica
      setAlunoId(userId);

      if (savedName) setUserName(savedName.split(" ")[0]);

      try {
        const { data: aluno } = await supabase
          .from('alunos')
          .select('status, role')
          .eq('id', userId)
          .single();

        if (aluno?.role === 'admin') setIsAdmin(true);

        if (aluno?.status !== 'ativo') {
          router.push("/aguarde");
          return;
        }

        const { data: aula } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('chave', 'aula_ao_vivo')
          .maybeSingle();

        if (aula && String(aula.valor) === 'true') {
          setAulaAtiva(true);
          setLinkAula(aula.link);
        } else {
          setAulaAtiva(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro:", err);
        setLoading(false);
      }
    };

    carregarDadosIniciais();
  }, [router]);

  // 4. MURAL DE AVISOS (Realtime)
  useEffect(() => {
    const fetchAvisos = async () => {
      const { data } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setAvisos(data);
    };

    fetchAvisos();

    const canal = supabase
      .channel('mural-avisos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, () => fetchAvisos())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

// Canal único para mudanças de aula ao vivo — definido acima (linhas 88-114)

  // 3. CÁLCULOS DE PROGRESSO (Baseado nos novos IDs)
  const contarConcluidos = (cat: string) =>
    VIDEOS_DATA.filter(v => v.categoria === cat && progressoSalvo.includes(v.id)).length;

  const totalPorCat = (cat: string) => VIDEOS_DATA.filter(v => v.categoria === cat).length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
      <Loader2 className="animate-spin" color="#C8A96E" size={40} />
      <span style={{ color: "#F0E8D8", opacity: 0.5, letterSpacing: "1px" }}>SINCRONIZANDO DADOS...</span>
    </div>
  );



  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", transition: "0.3s" }}>
      {avisoAula && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#2D8CFF',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 9999,
          animation: 'slideIn 0.10s forwards'
        }}>
          🚀 O professor acabou de iniciar a aula!
        </div>
      )}
      <CourseHeader activePage="Dashboard" />
      <RankingWidget />

      <main style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
        <header style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "32px", margin: 0 }}>Olá, <span style={{ color: "var(--primary)" }}>{userName}</span></h1>
            <p style={{ opacity: 0.6, marginTop: "5px" }}>Seu treinamento de elite está {Math.round((progressoSalvo.length / VIDEOS_DATA.length) * 100)}% concluído.</p>
          </div>
          {isAdmin && (
            <Link href="/admin" style={{ background: 'var(--primary)', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '12px' }}>
              ⚙️ PAINEL ADMIN
            </Link>
          )}
        </header>

        {/* BOTÃO DE AULA DINÂMICO */}
        <div style={{
          background: aulaAtiva ? "rgba(45, 140, 255, 0.1)" : "#f5f5f5",
          border: aulaAtiva ? "2px solid #2D8CFF" : "1px solid #ccc",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: aulaAtiva ? 1 : 0.7 // Fica "apagadinho" se estiver desativado
        }}>
          <div>
            <h3 style={{ color: aulaAtiva ? "#2D8CFF" : "#666", margin: 0, fontSize: "20px" }}>
              {aulaAtiva ? "⚡ Aula Online Liberada!" : "Aguardando Início da Aula"}
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", opacity: 0.8 }}>
              {aulaAtiva
                ? "O instrutor já está na sala. Valide sua presença para entrar."
                : "O professor ainda não iniciou a transmissão de hoje."}
            </p>
          </div>

          <button
            disabled={!aulaAtiva}
            onClick={() => setMostrarModal(true)}
            style={{
              background: aulaAtiva ? "linear-gradient(135deg, #2D8CFF 0%, #1A73E8 100%)" : "#222",
              color: "#fff",
              border: "none",
              padding: "15px 30px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: aulaAtiva ? "pointer" : "not-allowed",
              boxShadow: aulaAtiva ? "0 4px 15px rgba(45, 140, 255, 0.4)" : "none",
              transition: "0.3s",
              animation: aulaAtiva ? "pulse 2s infinite" : "none"
            }}
          >
            {aulaAtiva ? "ENTRAR NA SALA AGORA" : "SALA FECHADA"}
          </button>
        </div>

        {/* MURAL DE AVISOS */}
        {avisos.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "14px", letterSpacing: "1px", opacity: 0.5, marginBottom: "15px" }}>📢 MURAL DO INSTRUTOR</h3>
            <div style={{ display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "10px" }}>
              {avisos.map(aviso => (
                <div key={aviso.id} style={{ 
                  minWidth: "300px", background: "var(--card-bg)", padding: "20px", borderRadius: "12px", 
                  border: "1px solid var(--border)", borderLeft: `5px solid ${aviso.tipo === 'urgente' ? '#E05C5C' : aviso.tipo === 'sucesso' ? '#5CBF8A' : '#2D8CFF'}`,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
                }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "var(--primary)" }}>{aviso.titulo}</h4>
                  <p style={{ margin: "10px 0 0 0", fontSize: "14px", opacity: 0.8, lineHeight: "1.4" }}>{aviso.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROGRESSO DETALHADO (O que você gostou) */}
        <div style={{ background: "var(--card-bg)", padding: "25px", borderRadius: "15px", border: "1px solid var(--border)", marginBottom: "40px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", letterSpacing: "1px", opacity: 0.5 }}>RESUMO POR MATÉRIA</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <ProgressDash titulo="Legislação" concluidos={contarConcluidos("legislacao")} total={totalPorCat("legislacao")} />
            <ProgressDash titulo="Sinalização" concluidos={contarConcluidos("sinalizacao")} total={totalPorCat("sinalizacao")} />
            <ProgressDash titulo="Direção Defensiva" concluidos={contarConcluidos("direcao")} total={totalPorCat("direcao")} />
            <ProgressDash titulo="1º Socorros" concluidos={contarConcluidos("primeiros_socorros")} total={totalPorCat("primeiros_socorros")} />
          </div>
        </div>

        {/* GRID DE CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <CardLink href="/aulas" icon={<Play />} title="Continuar Aulas" desc="Assista aos vídeos e ganhe XP." />
          <CardLink href="/simulados" icon={<GraduationCap />} title="Simulado Oficial" desc="Teste seus conhecimentos para a prova." />
          <CardLink href="/quiz" icon={<Zap />} title="Quizzes Rápidos" desc="Fixação de conteúdo por temas." />
        </div>
      </main>
      {/* O MODAL DA CÂMERA (COLOQUE NO FINAL DO ARQUIVO, ANTES DO ÚLTIMO </div>) */}
      {mostrarModal && (
        <ValidadorAula
          linkAula={linkAula}
          alunoId={alunoId}
          onClose={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}

interface CardLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function CardLink({ href, icon, title, desc }: CardLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ padding: "30px", border: "1px solid var(--border)", borderRadius: "15px", background: "var(--card-bg)", transition: "0.3s", height: "100%" }}>
        <div style={{ color: "var(--primary)", marginBottom: "15px" }}>{icon}</div>
        <h4 style={{ color: "var(--foreground)", margin: "0 0 10px 0" }}>{title}</h4>
        <p style={{ fontSize: "14px", color: "var(--foreground)", opacity: 0.6 }}>{desc}</p>
      </div>
    </Link>
  );
}
