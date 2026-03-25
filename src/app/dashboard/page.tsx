"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CourseHeader from "@/components/CourseHeader";
import ProgressDash from "@/components/ProgressDash";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import RankingWidget from "@/components/Ranking/RankingWidget";
import { Play, GraduationCap, Zap, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import ValidadorAula from "@/components/ValidadorAula"; // Importe o componente que criamos
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
  const [alunoId, setAlunoId] = useState("");
  const [avisoAula, setAvisoAula] = useState(false);
  const [avisarQueEstouOnline, setAvisarQueEstouOnline] = useState(false);


  // 1. VERIFICAR SE O USUARIO ESTÁ LOGADO
  useEffect(() => {
    const verificarSessao = async () => {
      const userId = localStorage.getItem("user-id");
      const sessaoLocal = localStorage.getItem("id-sessao");
      const userRole = localStorage.getItem("user-role"); // Pegamos o cargo salvo no login

      // REGRA DE OURO: Se for admin, ele tem passe livre!
      if (userRole === 'admin') return;

      if (!userId || !sessaoLocal) return;

      const { data } = await supabase
        .from('alunos')
        .select('id_sessao')
        .eq('id', userId)
        .single();

      if (data && data.id_sessao !== sessaoLocal) {
        alert("⚠️ ACESSO NEGADO: Sua conta de ALUNO foi conectada em outro dispositivo.");
        localStorage.clear();
        window.location.href = "/";
      }
    };

    verificarSessao();
    const intervalo = setInterval(verificarSessao, 15000); // 15 segundos está ótimo
    return () => clearInterval(intervalo);
  }, []);

  // 1. SISTEMA ONLINE (Heartbeat único e limpo)
  useEffect(() => {
    const avisarQueEstouOnline = async () => {
      const id = localStorage.getItem("user-id");
      if (!id) return;
      await supabase.from("alunos").update({ ultima_atividade: new Date().toISOString() }).eq("id", id);
    };
    avisarQueEstouOnline();
    const interval = setInterval(avisarQueEstouOnline, 20000); // 20 segundos
    return () => clearInterval(interval);
  }, []);

// 2. EVENTO DE FOCUS PARA ATUALIZAR ONLINE
  useEffect(() => {
  const handleFocus = () => avisarQueEstouOnline();
  window.addEventListener("focus", handleFocus);

  return () => window.removeEventListener("focus", handleFocus);
}, []);

  // 2. VERIFICAÇÃO DE ACESSO E CARREGAMENTO
  useEffect(() => {
  const canal = supabase
    .channel('mudanca-aula')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'configuracoes' },
      (payload) => {
        const dadosNovos = payload.new as any;

        if (dadosNovos.chave === 'aula_ao_vivo') {
          const ativo = String(dadosNovos.valor) === 'true';

          setAulaAtiva(ativo);
          setLinkAula(ativo ? dadosNovos.link : "");

          if (!ativo) {
            setMostrarModal(false);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
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

useEffect(() => {
  const canal = supabase
    .channel('mudanca-aula')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'configuracoes' },
      (payload) => {
        const dadosNovos = payload.new as any;

        if (dadosNovos.chave === 'aula_ao_vivo') {
          const ativo = String(dadosNovos.valor) === 'true';

          setAulaAtiva(ativo);
          setLinkAula(ativo ? dadosNovos.link : "");

          if (!ativo) {
            setMostrarModal(false);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);

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
            <h3 style={{ color: aulaAtiva ? "#2D8CFF" : "#666", margin: 0 }}>
              {aulaAtiva ? "🚨 Aula Online Iniciada!" : "Aguardando Início da Aula"}
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
              {aulaAtiva
                ? "Clique para validar sua biometria e entrar."
                : "O professor ainda não abriu a sala de aula."}
            </p>
          </div>

          <button
            disabled={!aulaAtiva} // DESABILITADO se não tiver aula
            onClick={() => setMostrarModal(true)}
            style={{
              background: aulaAtiva ? "#2D8CFF" : "#ccc",
              color: "#fff",
              border: "none",
              padding: "12px 25px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: aulaAtiva ? "pointer" : "not-allowed"
            }}
          >
            {aulaAtiva ? "ENTRAR NA SALA" : "SALA FECHADA"}
          </button>
        </div>
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

// Subcomponente de Card para o código ficar limpo
function CardLink({ href, icon, title, desc }: any) {
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
