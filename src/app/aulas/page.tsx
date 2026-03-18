"use client";

import { useState, useEffect, useRef } from "react";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import ProgressDash from '@/components/ProgressDash';
import CourseHeader from '@/components/CourseHeader';
import RankingWidget from "@/components/Ranking/RankingWidget";
import { supabase } from "@/lib/supabase";

const CATEGORY_CONFIG: Record<string, any> = {
  "Todos": { icon: "⊞", color: "#C8A96E", bg: "rgba(200,169,110,0.15)" },
  "Acidentes": { icon: "⚠", color: "#E05C5C", bg: "rgba(224,92,92,0.15)" },
  "Legislação": { icon: "§", color: "#5C8FE0", bg: "rgba(92,143,224,0.15)" },
  "Prática": { icon: "◈", color: "#5CBF8A", bg: "rgba(92,191,138,0.15)" },
};

export default function AulasPage() {
  const [videos] = useState(VIDEOS_DATA);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeVideo, setActiveVideo] = useState(VIDEOS_DATA[0]);
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [podeConcluir, setPodeConcluir] = useState(false);
  const categories = ["Todos", "Acidentes", "Legislação", "Prática"];

  // 1. CARREGAR PROGRESSO INICIAL
  useEffect(() => {
    const salvo = localStorage.getItem("progresso-aulas");
    if (salvo) setConcluidos(JSON.parse(salvo));
  }, []);

  // 2. LOGICA DA TRAVA DE SEGURANÇA (O que a Autoescola pediu)
  useEffect(() => {
    setPodeConcluir(false); // Bloqueia ao trocar vídeo
    
    // Se já concluiu a aula antes, libera direto
    if (concluidos.includes(activeVideo.id)) {
      setPodeConcluir(true);
      return;
    }

    // Timer que simula os 80% da aula assistida (Ajuste o tempo aqui)
    const tempoNecessario = 800000; // 40 segundos para teste
    const timer = setTimeout(() => {
      setPodeConcluir(true);
      window.dispatchEvent(new CustomEvent("ia-notificacao", { 
        detail: "🎯 Aula assistida o suficiente! Você já pode ganhar seu XP." 
      }));
    }, tempoNecessario);

    return () => clearTimeout(timer);
  }, [activeVideo.id, concluidos]);

  // 3. MOTOR DE GAMIFICAÇÃO (BANCO DE DADOS)
  const ganharXpEEvoluir = async (quantidade: number, aulaId: string) => {
    const userId = localStorage.getItem("user-id");
    if (!userId) return;

    try {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('xp, nivel, aulas_concluidas')
        .eq('id', userId)
        .single();

      const xpAtual = aluno?.xp || 0;
      const nivelAntigo = aluno?.nivel || "Recruta";
      const concluidasAntigas = aluno?.aulas_concluidas || [];

      if (concluidasAntigas.includes(aulaId)) return;

      const novasConcluidas = [...new Set([...concluidasAntigas, aulaId])];
      const novoXp = xpAtual + quantidade;

      let novoNivel = "Recruta";
      if (novoXp > 2000) novoNivel = "Piloto Pro";
      else if (novoXp > 1000) novoNivel = "Motorista";
      else if (novoXp > 500) novoNivel = "Aprendiz";

      await supabase
        .from('alunos')
        .update({ xp: novoXp, nivel: novoNivel, aulas_concluidas: novasConcluidas })
        .eq('id', userId);

      window.dispatchEvent(new Event("xpAtualizado"));
      const msg = novoNivel !== nivelAntigo ? `🚀 EVOLUÇÃO! Nível ${novoNivel}!` : `🎯 +${quantidade} XP!`;
      window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: msg }));
    } catch (e) { console.error(e); }
  };

  // 4. FUNÇÃO DO BOTÃO FINALIZAR
  const finalizarAula = async (idDaAula: string) => {
    if (isLoading || concluidos.includes(idDaAula)) return;

    if (!podeConcluir) {
      window.dispatchEvent(new CustomEvent("ia-notificacao", { 
        detail: "⚠️ IA: Você precisa assistir a aula para liberar o XP!" 
      }));
      return;
    }

    setIsLoading(true);
    try {
      const novaLista = [...concluidos, idDaAula];
      setConcluidos(novaLista);
      localStorage.setItem("progresso-aulas", JSON.stringify(novaLista));
      await ganharXpEEvoluir(100, idDaAula);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. SELEÇÃO DE VÍDEOS
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newFiltered = cat === "Todos" ? videos : videos.filter(v => v.categoria === cat);
    if (newFiltered.length > 0) {
      setActiveVideo(newFiltered[0]);
      setPlayerReady(false);
    }
  };

  const filtered = selectedCategory === "Todos" ? videos : videos.filter(v => v.categoria === selectedCategory);
  const catColor = CATEGORY_CONFIG[activeVideo.categoria]?.color || "#C8A96E";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "serif", color: "var(--foreground)" }}>
      <CourseHeader activePage="Aulas" />
      <RankingWidget />
      
      <div style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
        <ProgressDash concluidos={concluidos.length} total={videos.length} />
      </div>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 12, letterSpacing: "2px", color: "var(--primary)", fontWeight: "bold", textTransform: "uppercase" }}>Módulo de Vídeo-Aulas</p>
          <h1 style={{ fontSize: 32, fontWeight: "normal" }}>
            <span style={{ color: catColor }}>{activeVideo.categoria}</span> — Preparação Elite
          </h1>
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => handleCategoryChange(cat)} style={{
              padding: "10px 22px", borderRadius: 4, border: selectedCategory === cat ? `1px solid ${CATEGORY_CONFIG[cat].color}` : "1px solid var(--border)",
              background: selectedCategory === cat ? CATEGORY_CONFIG[cat].bg : "transparent", color: selectedCategory === cat ? CATEGORY_CONFIG[cat].color : "var(--foreground)",
              cursor: "pointer", fontSize: 12, textTransform: "uppercase"
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          {/* LADO ESQUERDO: PLAYER */}
          <div>
            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
              {(!playerReady || isLoading) && (
                <div style={{ position: "absolute", inset: 0, background: "#0D0E11", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
                  <p style={{ color: "var(--primary)" }}>PREPARANDO AULA...</p>
                </div>
              )}
              <iframe
                onLoad={() => setPlayerReady(true)}
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allowFullScreen allow="autoplay; encrypted-media"
              />
            </div>

            <div style={{ marginTop: 20, padding: 24, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8 }}>
              {/* BOTÃO CONCLUIR COM TRAVA */}
              <button
                onClick={() => finalizarAula(activeVideo.id)}
                disabled={isLoading || (!podeConcluir && !concluidos.includes(activeVideo.id))}
                style={{
                  padding: "12px 24px", borderRadius: "4px", fontWeight: "bold", textTransform: "uppercase", cursor: (isLoading || !podeConcluir) ? "not-allowed" : "pointer",
                  background: concluidos.includes(activeVideo.id) ? "rgba(92,191,138,0.1)" : (podeConcluir ? catColor : "#333"),
                  border: `1px solid ${concluidos.includes(activeVideo.id) ? "#5CBF8A" : (podeConcluir ? catColor : "#444")}`,
                  color: concluidos.includes(activeVideo.id) ? "#5CBF8A" : (podeConcluir ? "#000" : "#777"),
                  width: "100%", marginBottom: 16, opacity: (podeConcluir || concluidos.includes(activeVideo.id)) ? 1 : 0.6
                }}
              >
                {isLoading ? "Salvando..." : (concluidos.includes(activeVideo.id) ? "✓ Aula Concluída" : (podeConcluir ? "Concluir Aula +100XP" : "⏳ Assista para liberar"))}
              </button>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--foreground)", opacity: 0.9 }}>{activeVideo.descricao}</p>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: PLAYLIST */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 15, maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ color: "var(--foreground)", opacity: 0.5, fontSize: 11, textTransform: "uppercase", marginBottom: 15 }}>Conteúdo · {filtered.length} vídeos</p>
            {filtered.map((video) => (
              <button key={video.id} onClick={() => { setPlayerReady(false); setActiveVideo(video); }} style={{
                display: "flex", gap: 12, padding: 10, borderRadius: 6, width: "100%", textAlign: "left", cursor: "pointer", background: video.id === activeVideo.id ? "rgba(200,169,110,0.1)" : "transparent",
                border: video.id === activeVideo.id ? "1px solid var(--primary)" : "1px solid transparent", marginBottom: 6, alignItems: "center"
              }}>
                <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} style={{ width: 80, height: 45, borderRadius: 4, opacity: concluidos.includes(video.id) ? 0.5 : 1 }} />
                <p style={{ fontSize: 14, color: video.id === activeVideo.id ? "var(--primary)" : "var(--foreground)", margin: 0 }}>{video.titulo}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}