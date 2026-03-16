"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Seus Componentes
import CourseHeader from "@/components/CourseHeader";
import ProgressDash from "@/components/ProgressDash";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import RankingWidget from "@/components/Ranking/RankingWidget";

// Ícones
import { Play, GraduationCap, Zap, Loader2, ShieldCheck } from "lucide-react";

export default function DashboardPrincipal() {
  const router = useRouter();
  const [concluidos, setConcluidos] = useState(0);
  const [userName, setUserName] = useState("Condutor");
  const [loading, setLoading] = useState(true);
  const [linkZoom, setLinkZoom] = useState("https://zoom.us"); // Link padrão caso o banco falhe
  // 1. Adicione um estado para saber se é admin
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    const verificarAcesso = async () => {
      const userId = localStorage.getItem("user-id");
      const savedName = localStorage.getItem("user-name");

      if (!userId) {
        router.push("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('status')
          .eq('id', userId)
          .single();

        if (error || !data) {
          console.error("Erro ao buscar status:", error);
          router.push("/");
          return;
        }
        // 2. Verificamos se ele é ADMIN (se for, já liga o botão especial)
        if (data.role === 'admin') {
          setIsAdmin(true);
        }

        // 🛡️ TRAVA DE SEGURANÇA: Só passa se estiver 'ativo'
        if (data.status !== 'ativo') {
          router.push("/aguarde");
        } else {
          if (savedName) setUserName(savedName.split(" ")[0]);
          setLoading(false); // Libera a tela
        }
      } catch (err) {
        console.error("Erro na verificação:", err);
        router.push("/");
      }
    };

    verificarAcesso();
  }, [router]);

  // Busca o link do zoom
  useEffect(() => {
    const buscarLinkZoom = async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('link_zoom')
        .single(); // Pega apenas a primeira linha

      if (!error && data?.link_zoom) {
        setLinkZoom(data.link_zoom);
      }
    };

    buscarLinkZoom();
  }, []);

  // Carrega progresso do localStorage
  useEffect(() => {
    const salvo = localStorage.getItem("progresso-aulas");
    if (salvo) {
      const listaIds = JSON.parse(salvo);
      setConcluidos(listaIds.length);
    }
  }, []);

  // 1. TELA DE CARREGAMENTO PROFISSIONAL
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0E11", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <Loader2 className="animate-spin" color="#C8A96E" size={40} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", opacity: 0.5 }}>
          <ShieldCheck size={18} color="#C8A96E" />
          <span style={{ color: "#F0E8D8", fontSize: "14px", letterSpacing: "1px" }}>VERIFICANDO ACESSO...</span>
        </div>
      </div>
    );
  }

  // 2. O SEU DASHBOARD ORIGINAL (DE VOLTA!)
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)", // AGORA DINÂMICO
      color: "var(--foreground)",     // AGORA DINÂMICO
      fontFamily: "sans-serif",
      transition: "all 0.3s ease"
    }}>
      <CourseHeader activePage="Dashboard" />
      <RankingWidget />

      <main style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px" }}>
        <header style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "10px", color: "var(--foreground)" }}>
            Olá, <span style={{ color: "var(--primary)" }}>{userName}</span>
          </h1>

          {isAdmin && (
            <Link href="/admin" style={{
              display: 'inline-block',
              background: 'var(--primary)',
              color: '#000', // Texto preto sobre o ouro fica melhor
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '13px',
              marginTop: '10px',
              boxShadow: '0 4px 10px rgba(200,169,110,0.3)'
            }}>
              ⚙️ ACESSAR PAINEL ADMIN
            </Link>
          )}
          <p style={{ color: "var(--foreground)", opacity: 0.7, fontSize: "16px", marginTop: "15px" }}>
            Bem-vindo ao seu painel de controle. Continue de onde parou.
          </p>
        </header>
        <button
          onClick={() => window.open("https://zoom.us/test", "_blank")}// Agora ele usa o link do banco!
          style={{
            background: "#2D8CFF",
            color: "#fff",
            border: "none",
            padding: "12px 25px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          ENTRAR NA AULA
        </button>
        <div style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#C8A96E",
          fontSize: "12px",
          opacity: 0.8
        }}>
          <span style={{ color: "#ff4d4d" }}>●</span>
          Monitoramento por câmera ativo para fins de certificação
        </div>

        {/* BARRA DE PROGRESSO - Agora dinâmica */}
        <div style={{
          background: "var(--card-bg)",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <ProgressDash concluidos={concluidos} total={VIDEOS_DATA.length} />
        </div>

        {/* GRID DE CARDS PRINCIPAIS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "25px",
          marginTop: "40px"
        }}>

          {/* CARD: CONTINUAR CURSO */}
          <Link href="/aulas" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: "30px",
              border: "1px solid var(--border)",
              borderRadius: "15px",
              background: "var(--card-bg)",
              height: "100%",
              transition: "0.3s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              boxSizing: "border-box"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(-5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ color: "var(--primary)", marginBottom: "15px" }}><Play size={32} /></div>
              <h4 style={{ color: "var(--foreground)", marginTop: 0, fontSize: "20px" }}>Continuar Curso</h4>
              <p style={{ fontSize: "15px", color: "var(--foreground)", opacity: 0.7, marginBottom: "20px", lineHeight: "1.5" }}>
                Você já completou {concluidos} aulas. Continue evoluindo na teoria!
              </p>
              <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "14px" }}>ASSISTIR AULAS →</span>
            </div>
          </Link>

          {/* CARD: SIMULADOS */}
          <Link href="/simulados" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: "30px",
              border: "1px solid var(--border)",
              borderRadius: "15px",
              background: "var(--card-bg)",
              height: "100%",
              transition: "0.3s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              boxSizing: "border-box"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(-5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ color: "var(--primary)", marginBottom: "15px" }}><GraduationCap size={32} /></div>
              <h4 style={{ color: "var(--foreground)", marginTop: 0, fontSize: "20px" }}>Simulado Oficial</h4>
              <p style={{ fontSize: "15px", color: "var(--foreground)", opacity: 0.7, marginBottom: "20px", lineHeight: "1.5" }}>
                30 questões com cronômetro para testar seu nível para a prova real.
              </p>
              <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "14px" }}>INICIAR PROVA →</span>
            </div>
          </Link>

          {/* CARD: QUIZZES */}
          <Link href="/quiz" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: "30px",
              border: "1px solid var(--border)",
              borderRadius: "15px",
              background: "var(--card-bg)",
              height: "100%",
              transition: "0.3s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              boxSizing: "border-box"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.transform = "translateY(-5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ color: "var(--primary)", marginBottom: "15px" }}><Zap size={32} /></div>
              <h4 style={{ color: "var(--foreground)", marginTop: 0, fontSize: "20px" }}>Quizzes de Fixação</h4>
              <p style={{ fontSize: "15px", color: "var(--foreground)", opacity: 0.7, marginBottom: "20px", lineHeight: "1.5" }}>
                Treine por temas específicos e veja a resposta correta na hora.
              </p>
              <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "14px" }}>TREINAR AGORA →</span>
            </div>
          </Link>

        </div>
      </main>
      {/* --- SEÇÃO DE PÓS-AULA E CERTIFICAÇÃO --- */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 40px" }}>
          
          {/* Card do Certificado */}
          <div style={{
            background: "linear-gradient(135deg, rgba(200, 169, 110, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)",
            border: "1px solid rgba(200, 169, 110, 0.3)",
            borderRadius: "20px",
            padding: "40px 20px",
            textAlign: "center",
            backdropFilter: "blur(10px)",
            marginTop: "20px"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>🎓</div>
            <h3 style={{ color: "#C8A96E", fontSize: "22px", margin: "0 0 10px 0" }}>
              Certificado de Conclusão
            </h3>
            <p style={{ color: "#F0E8D8", opacity: 0.7, fontSize: "14px", marginBottom: "25px" }}>
              O seu certificado será liberado automaticamente assim que você <br/> 
              completar 100% da carga horária e atingir a média nos simulados.
            </p>
            
            <button 
              disabled
              style={{
                background: "transparent",
                color: "rgba(200, 169, 110, 0.4)",
                border: "2px solid rgba(200, 169, 110, 0.2)",
                padding: "12px 35px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "not-allowed",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              Aguardando Requisitos
            </button>
          </div>

          {/* Aviso de Segurança e Biometria */}
          <div style={{
            marginTop: "30px",
            padding: "15px",
            borderRadius: "12px",
            background: "rgba(0,0,0,0.2)",
            borderLeft: "4px solid #C8A96E",
            display: "flex",
            flexDirection: "column",
            gap: "5px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "#ff4d4d", fontSize: "18px", animation: "pulse 2s infinite" }}>●</span>
              <strong style={{ color: "#F0E8D8", fontSize: "13px" }}>SISTEMA DE BIOMETRIA FACIAL ATIVO</strong>
            </div>
            <p style={{ color: "rgba(240, 232, 216, 0.6)", fontSize: "12px", margin: 0, marginLeft: "25px" }}>
              Para sua segurança e conformidade com o DETRAN, capturas aleatórias de imagem são realizadas para validar sua presença durante o curso.
            </p>
          </div>
        </div>

        
    </div>
  );
}