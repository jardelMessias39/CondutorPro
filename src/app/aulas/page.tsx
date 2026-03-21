"use client";

import { useState, useEffect, useRef } from "react";
import VIDEOS_DATA from '@/data/videos_curadoria.json';
import ProgressDash from '@/components/ProgressDash';
import CourseHeader from '@/components/CourseHeader';
import RankingWidget from "@/components/Ranking/RankingWidget";
import { supabase } from "@/lib/supabase";

// Mapeamento: O que aparece no botão -> O que está escrito no JSON
const CATEGORY_MAP: Record<string, string> = {
  "Todos": "Todos",
  "Acidentes": "primeiros_socorros",    // Se no JSON estiver "socorros"
  "Legislação": "legislacao", // Se no JSON estiver "legislacao"
  "Prática": "direcao"       // Se no JSON estiver "direcao" ou "pratica"
};

const CATEGORY_CONFIG: Record<string, any> = {
  "Todos": { icon: "⊞", color: "#C8A96E", bg: "rgba(200,169,110,0.15)" },
  "socorros": { icon: "⚠", color: "#E05C5C", bg: "rgba(224,92,92,0.15)" },
  "legislacao": { icon: "§", color: "#5C8FE0", bg: "rgba(92,143,224,0.15)" },
  "direcao": { icon: "◈", color: "#5CBF8A", bg: "rgba(92,191,138,0.15)" },
};

export default function AulasPage() {
  const [videos] = useState(VIDEOS_DATA);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeVideo, setActiveVideo] = useState(VIDEOS_DATA[0]);
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [segundosPassados, setSegundosPassados] = useState(0);
  const [tempoTotalVideo, setTempoTotalVideo] = useState(0); // em segundos
  const [podeConcluir, setPodeConcluir] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Nomes que aparecem nos botões
  const categories = ["Todos", "Acidentes", "Legislação", "Prática"];

  // 1. CARREGAR PROGRESSO
  useEffect(() => {
    const salvo = localStorage.getItem("progresso-aulas");
    if (salvo) {
      const listaIds = JSON.parse(salvo);
      setConcluidos(listaIds);
    }
  }, []);

  // 2. A LOGICA DE FILTRAGEM (Mais robusta)
  const filtered = videos.filter(v => {
    if (selectedCategory === "Todos") return true;

    // Isso aqui ignora maiúsculas/minúsculas e espaços extras para não dar erro
    const categoriaAlvo = CATEGORY_MAP[selectedCategory];
    return v.categoria?.toLowerCase() === categoriaAlvo?.toLowerCase();
  });

  // 3. O HANDLER DE CLIQUE (Corrigido para resetar o vídeo ativo ao filtrar)
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);

    const techName = CATEGORY_MAP[cat];
    const newFiltered = cat === "Todos"
      ? videos
      : videos.filter(v => v.categoria?.toLowerCase() === techName?.toLowerCase());

    if (newFiltered.length > 0) {
      setActiveVideo(newFiltered[0]);
      setPlayerReady(false);
    }
  };

  const finalizarAula = async (idDaAula: string) => {
    if (isLoading || concluidos.includes(idDaAula)) return;
    if (!podeConcluir) return;

    setIsLoading(true);
    const novaLista = [...concluidos, idDaAula];
    setConcluidos(novaLista);
    localStorage.setItem("progresso-aulas", JSON.stringify(novaLista));

    await ganharXpEEvoluir(100, idDaAula);
    setIsLoading(false);
  };

  const ganharXpEEvoluir = async (quantidade: number, aulaId: string) => {
    const userId = localStorage.getItem("user-id");
    if (!userId) return;
    try {
      const { data: aluno } = await supabase.from('alunos').select('*').eq('id', userId).single();
      const novasConcluidas = [...new Set([...(aluno?.aulas_concluidas || []), aulaId])];
      await supabase.from('alunos').update({
        xp: (aluno?.xp || 0) + quantidade,
        aulas_concluidas: novasConcluidas
      }).eq('id', userId);
      window.dispatchEvent(new Event("xpAtualizado"));
    } catch (e) { console.error(e); }
  };
  // --- LÓGICA DO CRONÔMETRO ---
  useEffect(() => {
    // Resetar tudo quando trocar de vídeo
    setSegundosPassados(0);
    setPodeConcluir(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Se já concluiu antes, libera direto e não precisa de timer
    if (concluidos.includes(activeVideo.id)) {
      setPodeConcluir(true);
      return;
    }

    // Inicia o cronômetro (só conta se o aluno estiver na página)
    timerRef.current = setInterval(() => {
      setSegundosPassados((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeVideo.id, concluidos]);

  // --- VERIFICAÇÃO DOS 70% ---
  useEffect(() => {

    // Vou usar 8 minutos (480s) como padrão caso não exista no seu JSON.
   const duracaoVideo = (activeVideo as any).duracaoSegundos || 480;
    const metaSegundos = duracaoVideo * 0.7;

    if (segundosPassados >= metaSegundos && !podeConcluir) {
      setPodeConcluir(true);
      window.dispatchEvent(new CustomEvent("ia-notificacao", {
        detail: "🎯 Meta de 70% atingida! Conhecimento absorvido, XP liberado!"
      }));
    }
  }, [segundosPassados, activeVideo, podeConcluir]);

  // --- CÁLCULO PARA O BOTÃO ---
     const duracaoVideo = (activeVideo as any).duracaoSegundos || 480;
  const meta = Math.ceil(duracaoVideo * 0.7);
  const faltam = meta - segundosPassados;

  // Formata segundos em MM:SS
  const formatarTempo = (s: number) => {
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // Cor de destaque baseada na categoria real do vídeo ativo
  const catColor = CATEGORY_CONFIG[activeVideo.categoria]?.color || "#C8A96E";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <CourseHeader activePage="Aulas" />
      <RankingWidget />

      <div style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
        <ProgressDash concluidos={concluidos.length} total={videos.length} />
      </div>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "40px 32px" }}>
        {/* FILTROS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
          {categories.map(cat => {
            const techKey = CATEGORY_MAP[cat]; // "primeiros_socorros"
            const config = CATEGORY_CONFIG[techKey] || CATEGORY_CONFIG["Todos"];

            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  // ... seus estilos
                  border: selectedCategory === cat ? `1px solid ${config.color}` : "1px solid var(--border)",
                  background: selectedCategory === cat ? config.bg : "transparent",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          {/* PLAYER */}
          <div>
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
              <iframe
                onLoad={() => setPlayerReady(true)}
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allowFullScreen allow="autoplay"
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => finalizarAula(activeVideo.id)}
                disabled={isLoading || !podeConcluir}
                style={{
                  padding: "18px",
                  width: "100%",
                  borderRadius: "8px",
                  cursor: podeConcluir ? "pointer" : "not-allowed",
                  background: concluidos.includes(activeVideo.id)
                    ? "rgba(92,191,138,0.2)"
                    : (podeConcluir ? "var(--primary)" : "#222"),
                  border: `1px solid ${podeConcluir ? "var(--primary)" : "#444"}`,
                  color: podeConcluir ? "#000" : "#666",
                  fontWeight: "bold",
                  transition: "all 0.4s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Barra de progresso visual dentro do botão */}
                {!podeConcluir && !concluidos.includes(activeVideo.id) && (
                  <div style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${(segundosPassados / meta) * 100}%`,
                    background: "rgba(200,169,110,0.1)",
                    zIndex: 0,
                    transition: "width 1s linear"
                  }} />
                )}

                <span style={{ position: "relative", zIndex: 1 }}>
                  {concluidos.includes(activeVideo.id)
                    ? "✓ AULA CONCLUÍDA"
                    : (podeConcluir
                      ? "FINALIZAR E GANHAR +100 XP"
                      : `AGUARDE MAIS ${formatarTempo(faltam)}`)}
                </span>
              </button>

              {!podeConcluir && !concluidos.includes(activeVideo.id) && (
                <p style={{ fontSize: "11px", textAlign: "center", marginTop: "8px", opacity: 0.6 }}>
                  Pela norma da portaria, assista pelo menos 70% do vídeo para validar.
                </p>
              )}
            </div>
          </div>

          {/* PLAYLIST */}
          <div style={{ background: "var(--card-bg)", borderRadius: 8, padding: 15, border: "1px solid var(--border)" }}>
            <p style={{ opacity: 0.5, fontSize: 12 }}>{filtered.length} VÍDEOS ENCONTRADOS</p>
            {filtered.map((video) => (
              <button key={video.id} onClick={() => { setPlayerReady(false); setActiveVideo(video); }} style={{
                display: "flex", gap: 10, padding: 10, width: "100%", background: video.id === activeVideo.id ? "rgba(200,169,110,0.1)" : "transparent",
                border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", alignItems: "center"
              }}>
                <div style={{ width: 40, height: 40, background: "#333", borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {concluidos.includes(video.id) ? "✅" : "▶"}
                </div>
                <span style={{ color: "var(--foreground)", fontSize: 13 }}>{video.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}