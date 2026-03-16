"use client";
import React, { useState, useEffect } from "react";
import CourseHeader from "@/components/CourseHeader";
import dadosQuestoes from "@/data/questoes.json";
import { Trophy, RefreshCw, Home } from "lucide-react"; // Ícones para o final
import RankingWidget from "@/components/Ranking/RankingWidget";
export default function QuizPage() {
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [questoesQuiz, setQuestoesQuiz] = useState<any[]>([]);
  const [pontuacao, setPontuacao] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    const listaBase = Array.isArray(dadosQuestoes) ? dadosQuestoes : (dadosQuestoes as any).todasQuestoes;
    if (listaBase && listaBase.length > 0) {
      const embaralhadas = [...listaBase].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestoesQuiz(embaralhadas);
    }
  }, []);

 const handleValidar = () => {
  if (selecionada === null) {
    alert("Selecione uma opção!");
    return;
  }

  const q = questoesQuiz[perguntaAtual];

  // descobrir índice da opção escolhida
  const indiceSelecionado = q.opcoes.findIndex((op: string) => op === selecionada);

  if (indiceSelecionado === q.correta) {
    setPontuacao((prev) => prev + 1);
  }

  setConfirmado(true);
};

  const proximaQuestao = () => {
    if (perguntaAtual < questoesQuiz.length - 1) {
      setPerguntaAtual(prev => prev + 1);
      setSelecionada(null);
      setConfirmado(false);
    } else {
      setFinalizado(true);
    }
  };

  if (questoesQuiz.length === 0) return <div style={{background: "#0D0E11", color: "white", height: "100vh", padding: "50px"}}>Carregando...</div>;

  // TELA DE RESULTADO FINAL
  if (finalizado) {
    return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", display: "flex", flexDirection: "column", transition: "all 0.3s ease" }}>
      <CourseHeader activePage="Quizzes" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ 
          background: "var(--card-bg)", padding: "50px", borderRadius: "20px", 
          border: "1px solid var(--border)", textAlign: "center", maxWidth: "500px", width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <Trophy size={80} color="var(--primary)" style={{ marginBottom: "20px" }} />
          <h1 style={{ fontSize: "32px", marginBottom: "10px", color: "var(--foreground)" }}>Quiz Finalizado!</h1>
          <p style={{ fontSize: "18px", opacity: 0.8, marginBottom: "30px", color: "var(--foreground)" }}>
            Você acertou <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "24px" }}>{pontuacao}</span> de {questoesQuiz.length} questões.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <button onClick={() => window.location.reload()} style={{ 
              padding: "15px", background: "var(--primary)", border: "none", borderRadius: "8px", 
              color: "#000", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" 
            }}>
              <RefreshCw size={20} /> RECOMEÇAR TREINO
            </button>
            
            <button onClick={() => window.location.href = "/dashboard"} style={{ 
              padding: "15px", background: "transparent", border: "1px solid var(--border)", 
              color: "var(--foreground)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" 
            }}>
              <Home size={20} /> VOLTAR AO PAINEL
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- ESTADO DE PERGUNTA ATIVA --- */
const q = questoesQuiz[perguntaAtual];

return (
  <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", transition: "all 0.3s ease" }}>
    <CourseHeader activePage="Quizzes" />
    <RankingWidget />
    
    <main style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
      {/* Barra de Progresso visual no topo */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", opacity: 0.8 }}>Questão {perguntaAtual + 1} de {questoesQuiz.length}</span>
          <span style={{ color: "var(--primary)", fontWeight: "bold" }}>Acertos: {pontuacao}</span>
      </div>

      <div style={{ 
        background: "var(--card-bg)", 
        padding: "30px", 
        borderRadius: "16px", 
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }}>
        <p style={{ fontSize: "20px", marginBottom: "30px", lineHeight: "1.5", color: "var(--foreground)" }}>{q.pergunta}</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {q.opcoes.map((opcao: string, index: number) => {
            const isMarcada = selecionada === opcao;
            const isCorreta = confirmado && index === q.correta;
            const isErrada = confirmado && isMarcada && index !== q.correta;
            
            // Cores dinâmicas para Feedback de Resposta
            let bgColor = "transparent";
            let borderColor = "var(--border)";

            if (isCorreta) {
                bgColor = "rgba(45, 106, 79, 0.2)";
                borderColor = "#2D6A4F";
            } else if (isErrada) {
                bgColor = "rgba(168, 45, 45, 0.1)";
                borderColor = "#A82D2D";
            } else if (isMarcada) {
                bgColor = "var(--border)";
                borderColor = "var(--primary)";
            }

            return (
              <button
                key={`opcao-${index}`}
                onClick={() => !confirmado && setSelecionada(opcao)}
                style={{
                  padding: "16px", 
                  borderRadius: "8px", 
                  textAlign: "left",
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  color: "var(--foreground)", 
                  cursor: confirmado ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "16px"
                }}
              >
                {opcao}
              </button>
            );
          })}
        </div>

        <button 
          onClick={confirmado ? proximaQuestao : handleValidar}
          disabled={!selecionada && !confirmado}
          style={{ 
            marginTop: "30px", 
            width: "100%", 
            padding: "18px", 
            background: "var(--primary)", 
            color: "#000", 
            fontWeight: "bold", 
            border: "none", 
            borderRadius: "8px", 
            cursor: (!selecionada && !confirmado) ? "not-allowed" : "pointer",
            opacity: (!selecionada && !confirmado) ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => !(!selecionada && !confirmado) && (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {confirmado ? "PRÓXIMA PERGUNTA" : "VALIDAR RESPOSTA"}
        </button>
      </div>
    </main>
  </div>
);
}