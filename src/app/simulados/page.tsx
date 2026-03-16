"use client";

import { useState, useEffect } from 'react';
import dadosQuestoes from '@/data/questoes.json';
import CourseHeader from '@/components/CourseHeader';
import RankingWidget from "@/components/Ranking/RankingWidget";
import { supabase } from "@/lib/supabase";
;

export default function SimuladoPage() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [pontuacao, setPontuacao] = useState(0);
  const [simuladoFinalizado, setSimuladoFinalizado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(30 * 60); // 30 minutos
  const [simuladoIniciado, setSimuladoIniciado] = useState(false);
  const [explicacaoIA, setExplicacaoIA] = useState<string | null>(null);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [categoriasErradas, setCategoriasErradas] = useState<string[]>([]);


  // Iniciar as questões embaralhadas ao montar
  useEffect(() => {
    const embaralhadas = [...dadosQuestoes]
      .sort(() => Math.random() - 0.5)
      .slice(0, 30);
    setQuestoes(embaralhadas);
  }, []);

  // Timer: inicia quando simuladoIniciado for true
  useEffect(() => {
    if (!simuladoIniciado || tempoRestante <= 0|| simuladoFinalizado) return;

    const timer = setInterval(() => {
      setTempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [simuladoIniciado, tempoRestante, simuladoFinalizado]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  // 1. Defina o mapeador fora do componente ou dentro dele
const mapaDeAulas: Record<string, string> = {
  "Primeiros Socorros": "Acidentes",
  "Direção Defensiva": "Prática",
  "Legislação": "Legislação",
  "Meio Ambiente": "Legislação",
  "Sinalização": "Legislação",
  "Cidadania": "Legislação",
  "Mecânica Básica": "Prática"
};

  // Ação ao escolher uma opção
 const buscarExplicacaoIA = async (pergunta: string, escolhida: string, correta: string, categoriaQuestao: string) => {
  setCarregandoIA(true);

  // Descobre qual aula recomendar baseada no mapeamento
  const aulaRecomendada = mapaDeAulas[categoriaQuestao] || "Legislação";
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`, // ⚠️ Mova para .env depois!
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        // NOVO PROMPT MAIS INTELIGENTE
    messages: [
      {
       role: "system",
            content: `Você é um instrutor de autoescola sênior. 
            Use a técnica de Cadeia de Pensamento: 
            1. Analise por que a resposta '${escolhida}' está incorreta.
            2. Explique a lógica da resposta correta '${correta}' baseada no CTB.
            3. Finalize recomendando que o aluno assista à aula de '${aulaRecomendada}'.
            Seja curto e direto (máximo 3 frases).`
          },
          {
            role: "user",
            content: `Questão: ${pergunta}`
          }
     
    ],
      })
    });

    const data = await response.json();
    setExplicacaoIA(data.choices[0].message.content);
  } catch (error) {
    setExplicacaoIA(`A resposta correta é '${correta}'. Recomendo revisar o módulo de ${aulaRecomendada}.`);
  } finally {
    setCarregandoIA(false);
  }
};

const verificarResposta = (indexEscolhido: number) => {
  const questaoAtual = questoes[perguntaAtual];
  const acertou = indexEscolhido === questaoAtual.correta;

  let novaPontuacao = pontuacao;

  if (acertou) {
    novaPontuacao = pontuacao + 1;
    setPontuacao(novaPontuacao);

    // ✅ acertou → avança direto
    avancarQuestao(novaPontuacao);

  } else {
    setCategoriasErradas(prev => 
      prev.includes(questaoAtual.categoria)
       ? prev 
       : [...prev, questaoAtual.categoria]
    );

    const textoEscolhido = questaoAtual.opcoes[indexEscolhido];
    const textoCorreto = questaoAtual.opcoes[questaoAtual.correta];

    buscarExplicacaoIA(
      questaoAtual.pergunta,
      textoEscolhido,
      textoCorreto,
      questaoAtual.categoria
    );
  }

  
};
const avancarQuestao = async (pontuacaoFinal?: number) => {

  if (perguntaAtual < questoes.length - 1) {

    if (!simuladoIniciado) setSimuladoIniciado(true);
    setPerguntaAtual(perguntaAtual + 1);
    setExplicacaoIA(null);

  } else {

    const resultado = pontuacaoFinal ?? pontuacao;

    await registrarResultadoNoBanco(resultado, questoes.length);

    setSimuladoFinalizado(true);
  }
};

  if (questoes.length === 0) {
    return (
      <div style={{ background: "#0D0E11", minHeight: "100vh", color: "#C8A96E", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Carregando questões oficiais...
      </div>
    );
  }
  
  // 1. Crie esta função dentro do seu componente de Quiz
const registrarResultadoNoBanco = async (acertos: number, total: number) => {

  const userId = localStorage.getItem("user-id");

  if (!userId) {
    console.error("Usuário não encontrado:", userId);
    alert("Sessão expirada. Faça login novamente.");
    return;
  }

  const aproveitamento = Math.round((acertos / total) * 100);

  let xpGanho = 0;

  if (aproveitamento >= 90) xpGanho = 100;
  else if (aproveitamento >= 80) xpGanho = 80;
  else if (aproveitamento >= 70) xpGanho = 60;
  else if (aproveitamento >= 60) xpGanho = 40;
  else xpGanho = 20;

  // 🔎 Busca histórico atual
  const { data: aluno, error: erroBusca } = await supabase
    .from("alunos")
    .select("notas_simulados, xp")
    .eq("id", userId)
    .single();

  if (erroBusca) {
    console.error("Erro ao buscar aluno:", erroBusca);
    return;
  }

  const historicoAtual = Array.isArray(aluno?.notas_simulados)
    ? aluno.notas_simulados
    : [];

  const novaNota = {
    data: new Date().toISOString(),
    acertos: acertos,
    total: total,
    aproveitamento: aproveitamento
  };

  const novoHistorico = [novaNota, ...historicoAtual].slice(0, 10);

  const { error } = await supabase
    .from("alunos")
    .update({
      notas_simulados: novoHistorico,
      xp: (aluno?.xp || 0) + xpGanho
    })
    .eq("id", userId);

  if (error) {
    console.error("Erro ao salvar nota:", error);
  } else {
    console.log("✅ Nota salva no histórico!");
  }


};



 return (
  <div style={{ 
    background: "var(--background)", 
    minHeight: "100vh", 
    color: "var(--foreground)",
    transition: "all 0.3s ease" 
  }}>
    <CourseHeader activePage="Simulados" />
    <RankingWidget />

    {/* ── TIMER FLUTUANTE ── */}
    <div
      style={{
        position: "fixed",
        top: "100px",
        right: "40px",
        background: tempoRestante < 300 ? "rgba(255, 68, 68, 0.2)" : "var(--card-bg)",
        padding: "10px 20px",
        borderRadius: "8px",
        border: `1px solid ${tempoRestante < 300 ? "#ff4444" : "var(--primary)"}`,
        color: tempoRestante < 300 ? "#ff4444" : "var(--foreground)",
        fontWeight: "bold",
        fontSize: "20px",
        zIndex: 999,
        backdropFilter: "blur(5px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}
    >
      ⏱️ {formatarTempo(tempoRestante)}
    </div>

    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      {!simuladoFinalizado ? (
        <div
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
          }}
        >
          {/* HEADER DA QUESTÃO */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ color: "var(--primary)", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" }}>
              QUESTÃO {perguntaAtual + 1} DE 30
            </span>
            <span
              style={{
                background: "var(--border)",
                color: "var(--foreground)",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}
            >
              {questoes[perguntaAtual].categoria}
            </span>
          </div>

          {/* BARRA DE PROGRESSO DA SESSÃO */}
          <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: "10px", marginBottom: "30px" }}>
            <div
              style={{
                width: `${((perguntaAtual + 1) / 30) * 100}%`,
                height: "100%",
                background: "var(--primary)",
                transition: "width 0.3s ease",
                boxShadow: "0 0 10px var(--primary)"
              }}
            />
          </div>

          {/* PERGUNTA */}
          <h2 style={{ fontSize: "22px", marginBottom: "30px", lineHeight: "1.4", fontWeight: "normal", color: "var(--foreground)" }}>
            {questoes[perguntaAtual].pergunta}
          </h2>

          {/* OPÇÕES/ALTERNATIVAS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {questoes[perguntaAtual].opcoes.map((opcao: string, index: number) => (
              <button
                key={index}
                onClick={() => verificarResposta(index)}
                style={{
                  textAlign: "left",
                  padding: "18px",
                  background: "var(--background)", // Inverte para dar contraste com o card
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  fontSize: "15px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateX(5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    minWidth: "30px",
                    borderRadius: "50%",
                    border: "1px solid var(--primary)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "bold"
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                {opcao}
              </button>
            ))}
          </div>
          {/* BOX DE EXPLICAÇÃO DA IA */}
        { (carregandoIA || explicacaoIA) && (
          <div style={{
            marginTop: "20px",
            padding: "20px",
            background: "rgba(200, 169, 110, 0.1)", // Bege transparente
            borderRadius: "8px",
            borderLeft: "4px solid var(--primary)",
            animation: "fadeIn 0.5s ease"
          }}>
            <h4 style={{ color: "var(--primary)", margin: "0 0 10px 0", fontSize: "14px" }}>
              {carregandoIA ? "🤖 IA Analisando seu erro..." : "💡 Instrutor IA explica:"}
            </h4>
            <p style={{ fontSize: "14px", lineHeight: "1.6", margin: "0" }}>
              {carregandoIA ? "Aguarde um instante..." : explicacaoIA}
            </p>
            
            {!carregandoIA && (
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button 
                onClick={() => avancarQuestao()}
                style={{ background: "var(--primary)", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", color: "#0D0E11" }}
              >
                ENTENDI, PRÓXIMA →
              </button>
              
              
            </div>
            )}
          </div>
        )}
        </div>
      ) : (
       /* ── TELA DE RESULTADO FINAL ── */
        <div style={{ 
          textAlign: "center", 
          padding: "50px", 
          background: "var(--card-bg)", 
          border: `2px solid var(--primary)`, 
          borderRadius: "15px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ color: "var(--primary)", fontSize: "28px", textTransform: "uppercase", letterSpacing: "2px" }}>Resultado Final</h2>
          
          <div style={{ fontSize: "82px", fontWeight: "bold", margin: "20px 0", color: "var(--foreground)" }}>
            {pontuacao}<span style={{ fontSize: "24px", opacity: 0.5 }}>/30</span>
          </div>

          <p style={{ 
            color: pontuacao >= 21 ? "#5CBF8A" : "#E05C5C", 
            fontSize: "22px", 
            fontWeight: "bold",
            background: pontuacao >= 21 ? "rgba(92,191,138,0.1)" : "rgba(224,92,92,0.1)",
            padding: "10px",
            borderRadius: "8px",
            display: "inline-block"
          }}>
            {pontuacao >= 21 ? "✅ APROVADO NO DETRAN!" : "❌ REPROVADO. Continue estudando."}
          </p>

          {/* ── PLANO DE ESTUDO PERSONALIZADO (IA) ── */}
          {categoriasErradas.length > 0 && (
            <div style={{ 
              marginTop: "30px", 
              padding: "20px", 
              background: "rgba(200, 169, 110, 0.05)", 
              borderRadius: "10px", 
              border: "1px dashed var(--primary)",
              textAlign: "left" // Alinhado à esquerda para parecer um relatório
            }}>
              <h3 style={{ color: "var(--primary)", fontSize: "18px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                🤖 Plano de Estudo Personalizado
              </h3>
              <p style={{ fontSize: "14px", marginBottom: "15px", color: "var(--foreground)" }}>
                Com base nos seus erros, recomendo focar nestas matérias:
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {categoriasErradas.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const aula = mapaDeAulas[cat] || "Legislação";
                      window.location.href = `/aulas?modulo=${aula.toLowerCase()}`;
                    }}
                    style={{ 
                      background: "transparent", 
                      border: "1px solid var(--primary)", 
                      color: "var(--primary)", 
                      padding: "8px 15px", 
                      borderRadius: "20px", 
                      cursor: "pointer", 
                      fontSize: "12px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(200, 169, 110, 0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    Revisar {cat} →
                  </button>
                ))}
              </div>
            </div>
          )}

          <br />
          
          {/* BOTÃO DE REINICIAR */}
          <button
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: "40px", 
              padding: "15px 40px", 
              background: "var(--primary)", 
              color: "#0D0E11", 
              border: "none", 
              borderRadius: "4px", 
              fontWeight: "bold", 
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Novo Simulado Aleatório
          </button>
        </div>
      )}
    </main>
  </div>
);
}