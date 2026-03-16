"use client"; // ESSENCIAL!

import { useState, useEffect, useRef } from "react";
import VIDEOS_DATA from '@/data/videos_curadoria.json'; // Certifique-se que o caminho está correto
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
  const [videos, setVideos] = useState(VIDEOS_DATA);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeVideo, setActiveVideo] = useState(VIDEOS_DATA[0]);
  const [concluidos, setConcluidos] = useState<string[]>([]); // Lista de IDs dos vídeos assistidos
  // ... resto do código que o Claude gerou
  const [isLoading, setIsLoading] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);
  const [podeConcluir, setPodeConcluir] = useState(false);
  const categories = ["Todos", "Acidentes", "Legislação", "Prática"];

  const filtered = selectedCategory === "Todos"
    ? videos
    : videos.filter(v => v.categoria === selectedCategory);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newFiltered = cat === "Todos" ? videos : videos.filter(v => v.categoria === cat);
    if (newFiltered.length > 0) {
      setActiveVideo(newFiltered[0]);
      setPlayerReady(false);
    }
  };

  const handleVideoSelect = (video: any) => {
    setPlayerReady(false);
    setActiveVideo(video);
  };
  // Carrega o progresso salvo quando a página abre
  useEffect(() => {
    const salvo = localStorage.getItem("progresso-aulas");
    if (salvo) setConcluidos(JSON.parse(salvo));
  }, []);

  // Função para marcar/desmarcar aula
  // --- MOTOR DE GAMIFICAÇÃO (COLE ESTA FUNÇÃO AQUI) ---
 const ganharXpEEvoluir = async (quantidade: number, aulaId: string) => {
  const userId = localStorage.getItem("user-id");
  if (!userId) return;

  // 1. Busca os dados atuais do aluno
  const { data: aluno } = await supabase
    .from('alunos')
    .select('xp, nivel, aulas_concluidas')
    .eq('id', userId)
    .single();

  const xpAtual = aluno?.xp || 0;
  const nivelAntigo = aluno?.nivel || "Recruta";
  const concluidasAntigas = aluno?.aulas_concluidas || [];

  // 2. Verifica se o aluno já concluiu essa aula
  if (concluidasAntigas.includes(aulaId)) {
    window.dispatchEvent(new CustomEvent("ia-notificacao", {
      detail: "Você já concluiu esta aula! O XP só é computado na primeira vez."
    }));
    return;
  }

  // 3. Adiciona a aula à lista
  const novasConcluidas = [...new Set([...concluidasAntigas, aulaId])];
  const novoXp = xpAtual + quantidade;

  // Lógica de nível
  let novoNivel = "Recruta";
  if (novoXp > 2000) novoNivel = "Piloto Pro";
  else if (novoXp > 1000) novoNivel = "Motorista";
  else if (novoXp > 500) novoNivel = "Aprendiz";

  // 4. Salva no Supabase
  const { error } = await supabase
    .from('alunos')
    .update({
      xp: novoXp,
      nivel: novoNivel,
      aulas_concluidas: novasConcluidas
    })
    .eq('id', userId);
   
  // 6. Notificação e atualização do sistema
  if (!error) {
    window.dispatchEvent(new Event("xpAtualizado"));

    const msg = novoNivel !== nivelAntigo
      ? `🚀 EVOLUÇÃO! Você agora é ${novoNivel}!`
      : `🎯 +${quantidade} XP! Aula registrada com sucesso.`;

    window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: msg }));
  }
};

  // --- FUNÇÃO DE MARCAR AULA (ATUALIZADA) ---
  
  useEffect(() => {
  let interval: NodeJS.Timeout;

  if (playerReady && !concluidos.includes(activeVideo.id)) {
    // Cria um vigia que checa o tempo a cada 2 segundos
    interval = setInterval(() => {
      const iframe = document.querySelector('iframe');
      // Infelizmente o iframe comum tem limitações, 
      // mas podemos liberar após um tempo X de aula aberta
      // ou se você estiver usando a API do YouTube (YT.Player)
    }, 2000);
  }

  return () => clearInterval(interval);
}, [playerReady, activeVideo.id]);


  const catColor = CATEGORY_CONFIG[activeVideo.categoria]?.color || "#C8A96E";
  // Esse código vai lá na tela onde o vídeo é exibido!
  const finalizarAula = async (idDaAula: string) => {
  // 1. Se já estiver carregando ou se a aula já foi concluída, não faz nada
  if (isLoading || concluidos.includes(idDaAula)) return;

  setIsLoading(true); // Ativa o "Carregando" no botão

  try {
    // 2. Cria a nova lista de aulas concluídas
    const novaLista = [...concluidos, idDaAula];

    // 3. Atualiza o estado local e o cache do navegador
    setConcluidos(novaLista);
    localStorage.setItem("progresso-aulas", JSON.stringify(novaLista));

    // 4. Chama a função que salva no Supabase e dá o XP (Apenas para aulas novas!)
    await ganharXpEEvoluir(100, idDaAula);
    
    console.log("✅ Progresso salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
  } finally {
    setIsLoading(false); // Desativa o "Carregando"
  }
};
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "var(--foreground)",
      transition: "all 0.3s ease",
    }}>

      <CourseHeader activePage="Aulas" />
      <RankingWidget />

      {/* ── BARRA DE PROGRESSO ── */}
      <div style={{
        background: "var(--card-bg)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 0",
        transition: "all 0.3s ease"
      }}>
        {/* Usando o estado de concluidos real para alimentar a barra */}
        <ProgressDash concluidos={concluidos.length} total={VIDEOS_DATA.length} />
      </div>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "40px 32px" }}>

        {/* ── TÍTULOS ── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.2em", color: "var(--primary)", margin: "0 0 8px 2px", textTransform: "uppercase", fontWeight: "bold" }}>
            Módulo de Vídeo-Aulas
          </p>
          <h1 style={{ fontSize: 32, fontWeight: "normal", margin: 0, letterSpacing: "0.02em", color: "var(--foreground)" }}>
            {activeVideo.categoria} — <span style={{ color: "var(--primary)" }}>Elite</span>
            <span style={{ color: catColor }}>{activeVideo.categoria}</span> — Preparação
          </h1>
        </div>

        {/* ── FILTROS DE CATEGORIA ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
          {categories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={{
                  padding: "10px 22px",
                  borderRadius: 4,
                  border: isActive ? `1px solid ${cfg.color}` : "1px solid var(--border)",
                  background: isActive ? (cfg.bg || "var(--card-bg)") : "transparent",
                  color: isActive ? cfg.color : "var(--foreground)",
                  opacity: isActive ? 1 : 0.7,
                  fontSize: 12,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                  fontWeight: isActive ? "bold" : "normal",
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

          {/* ── LADO ESQUERDO: PLAYER E INFO ── */}
          <div ref={playerRef}> {/* ACENDEU O playerRef AQUI */}
            <div style={{
              position: "relative",
              width: "100%",
              paddingTop: "56.25%",
              background: "#000",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}>
              {/* Overlay de carregamento usando o isLoading que estava apagado */}
              {(!playerReady || isLoading) && (
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  background: "#0D0E11", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10
                }}>
                  <p style={{ color: "var(--primary)", fontSize: "14px" }}>PREPARANDO AULA...</p>
                </div>
              )}

              <iframe
                onLoad={() => setPlayerReady(true)} // ACENDEU O setPlayerReady AQUI
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>

            {/* INFO CARD DINÂMICO */}
            <div style={{
              marginTop: 20,
              padding: "24px 28px",
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              transition: "all 0.3s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: "normal", margin: "0 0 8px 0", color: "var(--foreground)" }}>
                    {activeVideo.titulo}
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--foreground)", opacity: 0.7, marginBottom: 16 }}>
                    Instrutor: <span style={{ fontWeight: "bold", color: "var(--primary)" }}>{activeVideo.canal}</span>
                  </p>
                </div>

                {/* BOTÃO DE CONCLUIR ACENDENDO O toggleConcluida */}
                <button
                  onClick={() => finalizarAula(activeVideo.id)} // <--- AGORA VAI ACENDER!
                  disabled={isLoading}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "4px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    // Se estiver concluída, fica verde. Se não, usa a cor da categoria (catColor)
                    background: concluidos.includes(activeVideo.id) ? "rgba(92,191,138,0.1)" : catColor,
                    border: `1px solid ${concluidos.includes(activeVideo.id) ? "#5CBF8A" : catColor}`,
                    color: concluidos.includes(activeVideo.id) ? "#5CBF8A" : "#000",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease"
                  }}
                >
                  {isLoading ? "Salvando..." : (concluidos.includes(activeVideo.id) ? "✓ Aula Concluída" : "Concluir Aula +100XP")}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--foreground)", opacity: 0.9, margin: 0 }}>
                  {activeVideo.descricao}
                </p>
              </div>
            </div>
          </div>

          {/* ── LADO DIREITO: PLAYLIST ── */}
          <div style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "15px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <p style={{ color: "var(--foreground)", opacity: 0.5, fontSize: 11, textTransform: "uppercase", marginBottom: 15, fontWeight: "bold" }}>
              Conteúdo do Módulo · {filtered.length} vídeos
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((video) => {
                const isActive = video.id === activeVideo.id;
                const isFinalizada = concluidos.includes(video.id);
                return (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelect(video)}
                    style={{
                      display: "flex", gap: 12, padding: "10px", borderRadius: 6,
                      background: isActive ? "rgba(200,169,110,0.1)" : "transparent",
                      border: isActive ? "1px solid var(--primary)" : "1px solid transparent",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      alignItems: "center", transition: "all 0.2s ease",
                      position: "relative"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} style={{ width: 80, height: 45, borderRadius: 4, objectFit: "cover", opacity: isFinalizada ? 0.5 : 1 }} />
                      {isFinalizada && (
                        <div style={{ position: "absolute", top: 2, right: 2, background: "#5CBF8A", borderRadius: "50%", padding: "2px" }}>
                          <div style={{ color: "white", fontSize: "8px" }}>✓</div>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: isActive ? "var(--primary)" : "var(--foreground)", margin: 0, fontWeight: isActive ? "bold" : "normal" }}>
                      {video.titulo}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--background); }
        ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
      `}</style>
    </div>
  );
}
