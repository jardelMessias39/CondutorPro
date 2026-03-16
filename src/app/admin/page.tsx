"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, Trash2, Search, ShieldAlert, Loader2, XCircle, CheckCircle, Edit3, LogOut } from "lucide-react";

import BotaoRelatorio from "@/components/BotaoRelatorio";
import RankingWidget from "@/components/Ranking/RankingWidget";
import NotificationIA from "@/components/NotificationIA";
import { Sparkles } from "lucide-react";
// 🔑 DEFINA O E-MAIL DO DONO AQUI
const EMAIL_ADMIN = "dono@autoescola.com.br"; // Altere para o e-mail real do dono

const styleInputEdit = {
  background: "#1A1B1F",
  border: "1px solid #C8A96E",
  color: "#fff",
  padding: "8px",
  borderRadius: "5px",
  outline: "none",
  width: "100%"
};

export default function AdminPage() {
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [dadosEditados, setDadosEditados] = useState({ nome: "", cpf: "", email: "" });
  const [idExpandido, setIdExpandido] = useState<string | null>(null);
  const router = useRouter();

  const avisarIA = (mensagem: string) => {
    const evento = new CustomEvent("ia-notificacao", { detail: mensagem });
    window.dispatchEvent(evento);
  };

  const fazerLogout = () => {
  // 1. A IA manda o aviso primeiro
  avisarIA("Saindo do Sistema CondutorPro... Até logo!");

  // 2. Esperamos um tempinho (1.5 segundos) para o aluno ver o aviso da IA
  // e depois fazemos o logout automático
  setTimeout(() => {
    localStorage.clear(); 
    window.location.href = "/";
  }, 1500); 
};


  useEffect(() => {
    const verificarAcessoAdmin = async () => {
      const emailLogado = localStorage.getItem("user-email");


      if (!emailLogado) {
        router.push("/");
        return;
      }

      try {
        // 🛡️ Pergunta ao banco se esse e-mail tem a função de admin
        const { data, error } = await supabase
          .from('alunos')
          .select('role') // Use 'role' (ou o nome real da coluna sem tradução)
          .eq('email', emailLogado)
          .single();

        if (error || data?.role !== 'admin') {
          // Se não for admin no banco, ele é expulso
          avisarIA("Acesso negado! Área exclusiva para a administração.");
          router.push("/dashboard");
        } else {
          // SE FOR ADMIN:
          setAutorizado(true);
          buscarAlunos(); // Só busca a lista se for o dono
        }
      } catch (err) {
        console.error("Erro de segurança:", err);
        router.push("/");
      } finally {
        setCarregando(false);
      }
    };

    verificarAcessoAdmin();
  }, [router]);

  // Função para listar TODOS os alunos para o admin gerenciar
  const buscarAlunos = async () => {
    const { data, error } = await supabase
      .from("alunos")
      .select(`
    id,
    nome,
    email,
    cpf,
    status,
    role,
    created_at,
    xp,
    nivel,
    aulas_concluidas,
    notas_simulados
  `)
      .eq("role", "aluno")
      .order("xp", { ascending: false });

    if (error) {
      console.error("Erro ao buscar alunos:", error);
    } else {
      // Log para você conferir no console se os dados estão vindo
      console.log("Alunos carregados:", data);
      setAlunos(data || []);
    }
  };
  const alternarStatus = async (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === "ativo" ? "pendente" : "ativo";
    const { error } = await supabase
      .from("alunos")
      .update({ status: novoStatus })
      .eq("id", id);

    if (!error) buscarAlunos();
    avisarIA(novoStatus === "ativo" ? "Acesso liberado para o aluno!" : "Acesso do aluno bloqueado com sucesso.");
  };

  const deletarAluno = async (id: string) => {
    if (confirm("🚨 ATENÇÃO: Deseja realmente excluir este aluno do sistema?")) {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (!error) buscarAlunos();
      avisarIA("IA CondutorPro: Registro removido e ranking atualizado.");
    }
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) || a.cpf.includes(busca)
  );

  if (carregando) return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="animate-spin" color="#C8A96E" size={40} />
    </div>
  );

  if (!autorizado) return null; // Não mostra nada se não for o dono
  // Preenche os campos com os dados atuais do aluno
  const iniciarEdicao = (aluno: any) => {

    setEditandoId(aluno.id);

    // Use o seu objeto que você já criou
    setDadosEditados({
      nome: aluno.nome,
      cpf: aluno.cpf,
      email: aluno.email
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Salva as alterações no Banco de Dados
  const salvarEdicao = async (id: string) => {

    if (!dadosEditados.nome || !dadosEditados.email || !dadosEditados.cpf) {
      avisarIA("Preencha todos os campos");
      return;
    }

    const cpfLimpo = dadosEditados.cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      avisarIA("CPF inválido");
      return;
    }

    const { error } = await supabase
      .from("alunos")
      .update({
        nome: dadosEditados.nome,
        email: dadosEditados.email,
        cpf: dadosEditados.cpf
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      avisarIA("Erro ao atualizar dados.");
      return;
    }

    setEditandoId(null);
    buscarAlunos();
    avisarIA("Sincronização concluída! Os dados do aluno foram atualizados na nuvem.");

  };
  const limparCampos = () => {
    setEditandoId(null);
    setDadosEditados({ nome: "", cpf: "", email: "" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", color: "#F0E8D8", padding: "40px", fontFamily: "serif" }}>

      {/* CABEÇALHO DO PAINEL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert color="#C8A96E" size={28} />
            <h1 style={{ color: "#C8A96E", fontSize: "32px", margin: 0 }}>Gestão de Alunos</h1>
          </div>
          <p style={{ opacity: 0.6, marginTop: "5px" }}>Controle de matrículas e permissões da Autoescola</p>
          <RankingWidget />
          {/* NOVOS BOTÕES DE AÇÃO (RELATÓRIO E SAIR) */}
          <div style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
            <BotaoRelatorio alunos={alunosFiltrados} />

            <button
              onClick={fazerLogout}
              style={{
                background: "rgba(255, 68, 68, 0.1)",
                border: "1px solid #ff4444",
                color: "#ff4444",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "0.3s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 68, 68, 0.2)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 68, 68, 0.1)")}
            >
              <LogOut size={18} /> SAIR DO SISTEMA
            </button>
          </div>

        </div>
        <div style={{
          background: "rgba(200, 169, 110, 0.1)",
          border: "1px solid rgba(200, 169, 110, 0.3)",
          padding: "12px 20px",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "20px" }}>🤖</span>
          <span style={{ color: "#C8A96E", fontSize: "13px", fontWeight: "bold", letterSpacing: "0.5px" }}>
            IA CONDUTORPRO: <span style={{ color: "#F0E8D8", fontWeight: "normal" }}>Link da sala virtual sincronizado com os alunos com sucesso.</span>
          </span>
        </div>

        {/* BARRA DE BUSCA */}
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(200,169,110,0.2)",
              padding: "15px 15px 15px 45px",
              color: "#fff",
              borderRadius: "8px",
              width: "350px",
              outline: "none",
              fontSize: "16px"
            }}
          />
        </div>
      </div>


      {/* TABELA DE DADOS */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(200,169,110,0.15)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
          <thead>
            <tr style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E" }}>
              <th style={{ padding: "20px" }}>ALUNO / PATENTE</th>
              <th>E-MAIL</th>
              <th>CPF</th>
              <th>PONTUAÇÃO (XP)</th>
              <th>STATUS</th>
              <th style={{ textAlign: "right", paddingRight: "20px" }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.map((aluno) => {
              const isAberto = idExpandido === aluno.id;

              // 1. CÁLCULO DE AULAS (O que já está funcionando)
              const totalAulasDoCurso = 14;
              const listaConcluidas = Array.isArray(aluno.aulas_concluidas) ? aluno.aulas_concluidas : [];
              const concluidas = listaConcluidas.length;
              const porcentagemAulas = Math.min(100, Math.round((concluidas / totalAulasDoCurso) * 100));

              // 2. CÁLCULO DE NOTAS (Nova Melhoria)
              const historico = Array.isArray(aluno.notas_simulados) ? aluno.notas_simulados : [];
              const ultimaNota = historico.length > 0 ? historico[0].aproveitamento : 0;

              // Calcula a média de todas as notas do histórico
              const mediaNotas = historico.length > 0
                ? Math.round(historico.reduce((acc: number, n: any) => acc + (n.aproveitamento || 0), 0) / historico.length)
                : 0;

              return (
                <React.Fragment key={aluno.id}>
                  {/* LINHA PRINCIPAL DA TABELA */}
                  <tr
                    onClick={() => setIdExpandido(isAberto ? null : aluno.id)}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      background: isAberto ? "rgba(200,169,110,0.05)" : "transparent",
                      transition: "0.3s"
                    }}
                  >
                    <td style={{ padding: "20px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                        {editandoId === aluno.id ? (
                          <input
                            value={dadosEditados.nome}
                            onChange={(e) =>
                              setDadosEditados({
                                ...dadosEditados,
                                nome: e.target.value
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "4px",
                              borderRadius: "4px",
                              border: "1px solid #C8A96E",
                              background: "#1a1a1a",
                              color: "#fff"
                            }}
                          />
                        ) : (
                          aluno.nome
                        )}
                      </div>

                      <div style={{ fontSize: "10px", color: "#C8A96E", textTransform: "uppercase", marginTop: "4px" }}>
                        {aluno.nivel || "Recruta"} {isAberto ? "▲" : "▼"}
                      </div>
                    </td>



                    <td style={{ fontWeight: "bold", fontSize: "13px", opacity: 0.7 }}>
                      {editandoId === aluno.id ? (
                        <input
                          value={dadosEditados.email}
                          onChange={(e) =>
                            setDadosEditados({
                              ...dadosEditados,
                              email: e.target.value
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #C8A96E",
                            background: "#1a1a1a",
                            color: "#fff"
                          }}
                        />
                      ) : (
                        aluno.email
                      )}
                    </td>
                    <td style={{ fontWeight: "bold", fontSize: "13px", opacity: 0.7 }}>
                      {editandoId === aluno.id ? (
                        <input
                          value={dadosEditados.cpf}
                          onChange={(e) =>
                            setDadosEditados({
                              ...dadosEditados,
                              cpf: e.target.value
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #C8A96E",
                            background: "#1a1a1a",
                            color: "#fff"
                          }}
                        />
                      ) : (
                        aluno.cpf
                      )}
                    </td>

                    <td>
                      <span style={{ fontWeight: "bold", color: "#C8A96E", fontSize: "14px" }}>{aluno.xp || 0} XP</span>
                    </td>

                    <td>
                      <span style={{
                        fontSize: "10px", fontWeight: "bold",
                        color: aluno.status === "ativo" ? "#00ff88" : "#ff9100"
                      }}>
                        {aluno.status?.toUpperCase()}
                      </span>
                    </td>

                    {/* 🛠️ BOTOES DE AÇÕES (RECOLOCADOS AQUI) */}

                    <td style={{ textAlign: "right", paddingRight: "20px" }}>
                      <div
                        style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {editandoId === aluno.id ? (
                          <>
                            {/* Botão Salvar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                salvarEdicao(aluno.id);
                              }}
                              title="Salvar"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#00ff88",
                                cursor: "pointer"
                              }}
                            >
                              <CheckCircle size={18} />
                            </button>

                            {/* Botão Cancelar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                limparCampos();
                              }}
                              title="Cancelar"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ff4444",
                                cursor: "pointer"
                              }}
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Botão Editar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                iniciarEdicao(aluno);
                              }}
                              title="Editar"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#C8A96E",
                                cursor: "pointer"
                              }}
                            >
                              <Edit3 size={18} />
                            </button>

                            {/* Botão Bloquear / Ativar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alternarStatus(aluno.id, aluno.status);
                              }}
                              title={aluno.status === "ativo" ? "Bloquear" : "Ativar"}
                              style={{
                                background: "none",
                                border: "none",
                                color: aluno.status === "ativo" ? "#ff9100" : "#00ff88",
                                cursor: "pointer"
                              }}
                            >
                              {aluno.status === "ativo" ? (
                                <UserX size={18} />
                              ) : (
                                <UserCheck size={18} />
                              )}
                            </button>

                            {/* Botão Excluir */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletarAluno(aluno.id);
                              }}
                              title="Excluir"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ff4444",
                                cursor: "pointer",
                                opacity: 0.6
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>

                    </td>

                  </tr>

                  {/* PAINEL EXPANDIDO (RAIO-X COM NOTAS REAIS) */}
                  {isAberto && (
                    <tr>
                      <td colSpan={6} style={{ padding: "0 20px 20px 20px", background: "rgba(0,0,0,0.2)" }}>
                        <div style={{
                          padding: "25px",
                          border: "1px solid rgba(200,169,110,0.2)",
                          borderRadius: "0 0 12px 12px",
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "20px",
                          background: "#16171D"
                        }}>
                          {/* CARD PROGRESSO */}
                          <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: "11px", color: "#C8A96E", fontWeight: "bold", margin: "0 0 10px 0" }}>VÍDEO-AULAS</p>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{porcentagemAulas}%</div>
                            <div style={{ width: "100%", height: "6px", background: "#333", borderRadius: "3px", marginTop: "10px" }}>
                              <div style={{ width: `${porcentagemAulas}%`, height: "100%", background: "#C8A96E", borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "10px", opacity: 0.5, marginTop: "8px" }}>Concluiu {concluidas} de {totalAulasDoCurso} aulas.</p>
                          </div>

                          {/* CARD SIMULADOS (DINÂMICO) */}
                          <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: "11px", color: "#5CBF8A", fontWeight: "bold", margin: "0 0 10px 0" }}>DESEMPENHO QUIZ</p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <div style={{ fontSize: "24px", fontWeight: "bold", color: mediaNotas >= 70 ? "#00ff88" : "#ff9100" }}>{mediaNotas}%</div>
                              <div style={{ fontSize: "12px", opacity: 0.6 }}>Última: {ultimaNota}%</div>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#333", borderRadius: "3px", marginTop: "10px" }}>
                              <div style={{ width: `${mediaNotas}%`, height: "100%", background: mediaNotas >= 70 ? "#5CBF8A" : "#ff9100", borderRadius: "3px" }} />
                            </div>
                            <p style={{ fontSize: "10px", opacity: 0.5, marginTop: "8px" }}>Média baseada em {historico.length} simulados.</p>
                          </div>

                          {/* CARD ÚLTIMA ATIVIDADE */}
                          <div style={{ background: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p style={{ fontSize: "11px", color: "#8E9299", fontWeight: "bold", margin: "0 0 10px 0" }}>SITUAÇÃO</p>
                            <div style={{ fontSize: "16px", fontWeight: "bold", color: mediaNotas >= 70 ? "#F0E8D8" : "#ff4444" }}>
                              {mediaNotas >= 70 ? "Pronto para a Prova" : "Requer Atenção"}
                            </div>
                            <p style={{ fontSize: "11px", opacity: 0.6, marginTop: "5px" }}>
                              {historico.length === 0 ? "Ainda não realizou simulados." : `Último teste: ${new Date(historico[0]?.data).toLocaleDateString('pt-BR')}`}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {alunosFiltrados.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", opacity: 0.5 }}>
            Nenhum aluno encontrado.
          </div>
        )}

      </div>
      {/* 1. O Rádio das Notificações (Sem ele a IA não aparece) */}
      <NotificationIA />

      {/* 2. O Footer Premium (Copiado do login para manter o padrão) */}
      <footer style={{
        marginTop: "50px",
        padding: "30px 20px",
        borderTop: "1px solid rgba(200,169,110,0.1)",
        textAlign: "center",
        background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)"
      }}>
        <div style={{
          color: "#C8A96E",
          fontSize: "14px",
          letterSpacing: "1px",
          opacity: 0.8
        }}>
          © 2026 CONDUTORPRO - DESENVOLVIDO POR
          <span style={{ fontWeight: "bold", marginLeft: "5px", color: "#F0E8D8" }}>
            JARDEL MESSIAS
          </span>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(200,169,110,0.6)" }}>
            CONTATO: (XX) 9980-61093
          </div>
        </div>
        <div style={{
          fontSize: "10px",
          color: "rgba(255,255,255,0.3)",
          marginTop: "8px",
          textTransform: "uppercase"
        }}>
          Plataforma de Ensino Inteligente para Autoescolas
        </div>
      </footer>
    </div>



  );
}