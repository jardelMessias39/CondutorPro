"use client";

import React, { useState, useEffect } from "react";
import CourseHeader from "@/components/CourseHeader";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import RankingWidget from "@/components/Ranking/RankingWidget";

export default function ProgressoDetalhado() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [progressoSalvo, setProgressoSalvo] = useState<string[]>([]);
  const [notasPorCategoria, setNotasPorCategoria] = useState<number[]>([]);

  const totalAulas = VIDEOS_DATA.length;

  const categorias = [
    { nome: "Legislação", chave: "legislacao" },
    { nome: "Sinalização", chave: "sinalizacao" },
    { nome: "Direção Defensiva", chave: "direcao" },
    { nome: "Primeiros Socorros", chave: "socorros" } // Ajustado para "socorros" conforme o padrão do ID
  ];

  // 1. Detectar Tema
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme !== 'light');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // 2. Carregar Progresso e Calcular Notas
  useEffect(() => {
    const salvo = localStorage.getItem("progresso-aulas");
    const listaIDs: string[] = salvo ? JSON.parse(salvo) : [];
    setProgressoSalvo(listaIDs);

    // Cálculo das notas baseado no que foi carregado
    const calculo = categorias.map((cat) => {
      const aulasDaCategoria = VIDEOS_DATA.filter(v => v.categoria === cat.chave);
      if (aulasDaCategoria.length === 0) return 0;

      const concluidas = aulasDaCategoria.filter(v => listaIDs.includes(v.id)).length;
      return Math.round((concluidas / aulasDaCategoria.length) * 100);
    });

    setNotasPorCategoria(calculo);
    setMounted(true);
  }, []);

  const totalConcluidos = progressoSalvo.length;
  const percentualGeral = Math.round((totalConcluidos / totalAulas) * 100) || 0;

  if (!mounted) return <div style={{ background: "#0D0E11", minHeight: "100vh" }} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "serif",
      transition: "all 0.3s ease"
    }}>
      <CourseHeader activePage="Progresso" />
      <RankingWidget />

      <main style={{ maxWidth: "1000px", margin: "60px auto", padding: "0 20px" }}>

        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ color: "var(--primary)", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", fontWeight: "bold" }}>
            Análise de Desempenho
          </p>
          <h1 style={{ fontSize: "36px", fontWeight: "normal", marginTop: "10px", color: "var(--foreground)" }}>
            Seu Histórico de Estudo
          </h1>
          <p style={{ textAlign: "center", fontStyle: "italic", opacity: 0.8, marginTop: "10px" }}>
            {percentualGeral < 30 
              ? "🤖 IA: Você está no início da jornada. Foque em Legislação primeiro!" 
              : "🤖 IA: Ótimo progresso! Continue mantendo a constância nos simulados."}
          </p>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "30px" 
        }}>

          {/* Card: Progresso Geral */}
          <div style={{
            background: "var(--card-bg)",
            padding: "40px",
            borderRadius: "15px",
            border: "1px solid var(--border)",
            textAlign: "center",
            boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              width: "180px", height: "180px", borderRadius: "50%",
              border: `6px solid var(--border)`,
              margin: "0 auto 25px",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
            }}>
              <span style={{ fontSize: "42px", color: "var(--foreground)", fontWeight: "bold" }}>
                {percentualGeral}%
              </span>

              <div style={{
                position: "absolute", inset: "-6px", borderRadius: "50%",
                border: `6px solid var(--primary)`,
                clipPath: percentualGeral > 0 ? `polygon(50% 50%, 50% 0%, ${percentualGeral >= 25 ? '100% 0%,' : ''} ${percentualGeral >= 50 ? '100% 100%,' : ''} ${percentualGeral >= 75 ? '0% 100%,' : ''} ${percentualGeral >= 100 ? '0% 0%,' : ''} 50% 0%)` : 'none',
                transition: "all 1s ease",
                boxShadow: isDarkMode ? "0 0 15px var(--primary)" : "none",
                transform: "rotate(0deg)"
              }} />
            </div>
            <h3 style={{ fontSize: "20px", marginBottom: "10px", color: "var(--foreground)", fontWeight: "bold" }}>
              Vídeo-Aulas
            </h3>
            <p style={{ color: "var(--foreground)", opacity: 0.7, fontSize: "15px" }}>
              Você concluiu {totalConcluidos} de {totalAulas} aulas.
            </p>
          </div>
          
          {/* Card: Domínio por Matéria */}
          <div style={{
            background: "var(--card-bg)",
            padding: "40px",
            borderRadius: "15px",
            border: "1px solid var(--border)",
            boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ fontSize: "18px", marginBottom: "25px", color: "var(--primary)", fontWeight: "bold" }}>
              Domínio por Matéria
            </h3>

            {categorias.map((cat, index) => {
              const nota = notasPorCategoria[index] || 0;
              return (
                <div key={cat.chave} style={{ marginBottom: "20px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    fontSize: "12px"
                  }}>
                    <span style={{ color: "var(--foreground)" }}>{cat.nome}</span>
                    <span style={{ color: "var(--foreground)", fontWeight: "bold" }}>{nota}%</span>
                  </div>

                  <div style={{
                    width: "100%",
                    height: "6px",
                    background: "var(--border)",
                    borderRadius: "3px"
                  }}>
                    <div style={{
                      width: `${nota}%`,
                      height: "100%",
                      background: "var(--primary)",
                      boxShadow: isDarkMode ? "0 0 10px var(--primary)" : "none",
                      transition: "width 1s ease",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "50px", textAlign: "center" }}>
          <button
            onClick={() => window.location.href = '/simulados'}
            style={{
              background: "transparent",
              border: `1px solid var(--primary)`,
              color: "var(--primary)",
              padding: "15px 40px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: "bold",
              transition: "all 0.2s ease"
            }}
          >
            Reforçar Conhecimento com Simulado
          </button>
        </div>
      </main>
    </div>
  );
}