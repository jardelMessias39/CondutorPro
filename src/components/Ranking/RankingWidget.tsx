
"use client";

import React, { useState, useEffect } from "react";
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
          position: "fixed", bottom: "110px", right: "30px",
          width: "60px", height: "60px", borderRadius: "50%",
          background: "var(--primary)", border: "none", cursor: "pointer",
          fontSize: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)", zIndex: 9999,
        }}
      >
        🏆
      </button>

      {/* JANELA DO RANKING */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "180px", right: "30px", width: "320px",
          background: "var(--card-bg)", borderRadius: "15px", border: "1px solid var(--primary)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.8)", zIndex: 9999, padding: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h4 style={{ color: "var(--primary)", margin: 0, fontWeight: "bold" }}>RANKING DE ELITE</h4>
            <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--foreground)", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {loading ? (
              <p style={{ textAlign: "center", fontSize: "12px" }}>Carregando competidores...</p>
            ) : (
              listaAlunos.map((aluno, index) => (
                <div key={index} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px", borderRadius: "8px",
                  background: aluno.isMe ? "rgba(200, 169, 110, 0.2)" : "rgba(255,255,255,0.05)",
                  border: aluno.isMe ? "1px solid var(--primary)" : "none"
                }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary)" }}>{index + 1}º</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "var(--foreground)" }}>
                        {aluno.nome} {aluno.isMe ? "(Você)" : ""}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--primary)" }}>{aluno.xp} XP</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}