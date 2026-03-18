"use client";

import React, { useState, useEffect } from "react";
import CourseHeader from "@/components/CourseHeader";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import RankingWidget from "@/components/Ranking/RankingWidget";

export default function ProgressoDetalhado() {
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false); // Novo: Para evitar erro de Hydration
  const [notasSimuladas, setNotasSimuladas] = useState<number[]>([]); // Novo: Para fixar as notas
  const [isDarkMode, setIsDarkMode] = useState(true);
  const totalAulas = VIDEOS_DATA.length;
  const categorias = ["Legislação", "Sinalização", "Direção Defensiva", "Primeiros Socorros"];


  // Exemplo de lógica para detectar a mudança de tema pelo atributo data-theme:
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme !== 'light');
    };

    // Verifica ao carregar e cria um observador para mudanças
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
  const salvoAulas = localStorage.getItem("progresso-aulas");
  const concluidosIds = salvoAulas ? JSON.parse(salvoAulas) : [];
  setConcluidos(concluidosIds);

  // LÓGICA REAL: Mapear quais aulas de cada categoria foram concluídas
  const notasReais = categorias.map((cat) => {
    // Filtra as aulas do JSON que pertencem a essa categoria
    const aulasDaCategoria = VIDEOS_DATA.filter(v => v.categoria === cat);
    if (aulasDaCategoria.length === 0) return 0;

    // Conta quantas dessas aulas estão na lista de 'concluidos'
    const concluidasNessaCat = aulasDaCategoria.filter(v => concluidosIds.includes(v.id)).length;
    
    // Retorna a porcentagem real de progresso naquela matéria
    return Math.round((concluidasNessaCat / aulasDaCategoria.length) * 100);
  });

  setNotasSimuladas(notasReais);
  setMounted(true);
}, []);

  const percentualGeral = Math.round((concluidos.length / totalAulas) * 100) || 0;

  // Se ainda não montou no cliente, retorna um fundo vazio para evitar erro visual
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
        <p style={{ textAlign: "center", fontStyle: "italic", opacity: 0.8 }}>
          {percentualGeral < 30 
            ? "🤖 IA: Você está no início da jornada. Foque em Legislação primeiro!" 
            : "🤖 IA: Ótimo progresso! Seu domínio em Direção Defensiva está acima da média."}
        </p>
      </div>

      {/* AJUSTE AQUI: O grid agora é responsivo e muda para 1 coluna no celular */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "30px" 
      }}>

        {/* Card Esquerdo: Progresso em Vídeos */}
        <div style={{
          background: "var(--card-bg)",
          padding: "40px",
          borderRadius: "15px",
          border: "1px solid var(--border)",
          textAlign: "center",
          boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
          transition: "all 0.3s ease"
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
              clipPath: `inset(${100 - percentualGeral}% 0 0 0)`,
              transform: "rotate(180deg)",
              transition: "all 1s ease",
              boxShadow: isDarkMode ? "0 0 15px var(--primary)" : "none"
            }} />
          </div>
          <h3 style={{ fontSize: "20px", marginBottom: "10px", color: "var(--foreground)", fontWeight: "bold" }}>
            Vídeo-Aulas
          </h3>
          <p style={{ color: "var(--foreground)", opacity: 0.7, fontSize: "15px" }}>
            Você concluiu {concluidos.length} de {totalAulas} aulas.
          </p>
        </div>
        
        {/* Card Direito: Estatísticas por Categoria */}
        <div style={{
          background: "var(--card-bg)",
          padding: "40px",
          borderRadius: "15px",
          border: "1px solid var(--border)",
          boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
          transition: "all 0.3s ease"
        }}>
          <h3 style={{ fontSize: "18px", marginBottom: "25px", color: "var(--primary)", fontWeight: "bold" }}>
            Domínio por Matéria
          </h3>

          {categorias.map((cat, index) => {
            const nota = notasSimuladas[index] || 0;
            return (
              <div key={cat} style={{ marginBottom: "20px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "12px"
                }}>
                  <span style={{ color: "var(--foreground)" }}>{cat}</span>
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
          onMouseOver={(e) => e.currentTarget.style.background = isDarkMode ? "rgba(200,169,110,0.1)" : "rgba(0,86,179,0.05)"}
          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
        >
          Reforçar Conhecimento com Simulado
        </button>
      </div>
    </main>
  </div>
  );
}