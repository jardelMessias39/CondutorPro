
"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@/lib/supabase"; // Importando sua instância do Supabase
import { nomeDoNivel } from "@/lib/niveis";
export default function RankingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [listaAlunos, setListaAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Criamos a função usando useCallback para ela ser estável
  const buscarDadosReais = useCallback(async () => {
    setLoading(true);
    // 1. Buscamos todos os dados do usuário
    const { data, error } = await supabase
      .from('alunos')
      .select('nome, email, xp, nivel')
      .eq('status', 'ativo')
      .eq('role', 'aluno')
      .order('xp', { ascending: false })
      .limit(10);

      // 2. Atualizamos o estado com os dados recebidos
    if (!error && data) {
      const meuEmail = localStorage.getItem("user-email");
      setListaAlunos(data.map(aluno => ({
        ...aluno,
        isMe: aluno.email === meuEmail
      })));
    }
    setLoading(false);
  }, []);


  // 2. O useEffect agora conhece a função buscarDadosReais
  useEffect(() => {
    setMounted(true);
    buscarDadosReais();

    // Ouvinte para atualizar sem refresh quando ganhar XP
    const atualizarPlacar = () => buscarDadosReais();
    window.addEventListener("xpAtualizado", atualizarPlacar);

    return () => window.removeEventListener("xpAtualizado", atualizarPlacar);
  }, [buscarDadosReais]);

  if (!mounted) return null;



  return (
    <>
      


     {/* BOTÃO FLUTUANTE */}
<button
  onClick={() => setIsOpen(!isOpen)}
  style={{
    position: "fixed", 
    bottom: "110px", 
    right: "20px", // Reduzi um pouco para não ficar tão longe da borda no celular
    width: "60px", 
    height: "60px", 
    borderRadius: "50%",
    background: "var(--primary)", 
    border: "none", 
    cursor: "pointer",
    fontSize: "24px", 
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)", 
    zIndex: 9999,
  }}
>
  🏆
</button>

{/* JANELA DO RANKING */}
{isOpen && (
  <div style={{
    position: "fixed", 
    bottom: "180px", 
    right: "20px", 
    width: "calc(100% - 40px)", // Ocupa quase a largura toda no celular
    maxWidth: "320px", // Mas não passa de 320px no PC
    background: "#121212", // COR SÓLIDA: Resolve a transparência que você viu no print
    borderRadius: "15px", 
    border: "2px solid var(--primary)", // Borda mais grossa para destacar
    boxShadow: "0 10px 50px rgba(0,0,0,0.9)", // Sombra mais forte
    zIndex: 10000, // Maior que o botão
    padding: "20px",
    maxHeight: "60vh", // Não deixa o ranking sumir para fora da tela
    overflowY: "auto", // Adiciona scroll se tiver muitos alunos
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
      <h4 style={{ color: "var(--primary)", margin: 0, fontWeight: "bold", fontSize: "16px" }}>
        RANKING DE ELITE
      </h4>
      <button 
        onClick={() => setIsOpen(false)} 
        style={{ 
          background: "rgba(255,255,255,0.1)", 
          border: "none", 
          color: "#FFF", 
          cursor: "pointer",
          width: "25px",
          height: "25px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        ✕
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {loading ? (
        <p style={{ textAlign: "center", fontSize: "12px", color: "#ccc" }}>Carregando competidores...</p>
      ) : (
        listaAlunos.map((aluno, index) => (
          <div key={index} style={{
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            padding: "12px", 
            borderRadius: "10px",
            background: aluno.isMe ? "rgba(200, 169, 110, 0.25)" : "rgba(255,255,255,0.08)",
            border: aluno.isMe ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ 
                fontWeight: "bold", 
                color: index < 3 ? "#FFD700" : "var(--primary)", // Ouro para os top 3
                fontSize: "14px"
              }}>
                {index + 1}º
              </span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#FFFFFF" }}>
                  {aluno.nome} {aluno.isMe ? "⭐" : ""}
                </p>
              </div>
            </div>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: "var(--primary)" }}>
              {aluno.xp} XP
            </span>
          </div>
        ))
      )}
    </div>
  </div>
)}
    </>
  );
}