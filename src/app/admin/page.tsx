"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Aluno } from "@/types";
import {
  Users, CheckCircle, XCircle, Trash2,
  ShieldCheck, Trophy, BookOpen, BarChart3,
  LogOut, Download, Video, Car, Search, RefreshCw,
  Clock, Award, Zap
} from "lucide-react";
import * as XLSX from "xlsx";

const avisarIA = (mensagem: string) => {
  window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: mensagem }));
};

export default function AdminPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [aulaAtiva, setAulaAtiva] = useState(false);
  const [linkInput, setLinkInput] = useState("https://meet.google.com/hfe-hwdu-aum");
  const [realtimeStatus, setRealtimeStatus] = useState("conectando...");
  const [avisos, setAvisos] = useState<any[]>([]);
  const [novoAviso, setNovoAviso] = useState({ titulo: "", conteudo: "", tipo: "info" });
  const router = useRouter();

  const fetchAlunos = useCallback(async () => {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar alunos:", error.message);
    } else if (data) {
      setAlunos(data as Aluno[]);
    }
    setLoading(false);
  }, []);

  const carregarStatusAula = useCallback(async () => {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("link, valor")
      .eq("chave", "aula_ao_vivo")
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar status da aula:", error.message);
      return;
    }

    if (data) {
      if (data.link) setLinkInput(data.link);
      setAulaAtiva(String(data.valor) === 'true');
    }
  }, []);

  const fetchAvisos = useCallback(async () => {
    const { data } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAvisos(data);
  }, []);

  useEffect(() => {
    carregarStatusAula();
    fetchAlunos();
    fetchAvisos();

    // CANAL REALTIME PARA ALUNOS
    const channelAlunos = supabase
      .channel('admin-alunos')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alunos' },
        () => {
          console.log("Mudança detectada nos alunos, recarregando...");
          fetchAlunos();
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    // CANAL REALTIME PARA CONFIGURAÇÕES (Aula Online)
    const channelConfig = supabase
      .channel('admin-config')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'configuracoes', filter: 'chave=eq.aula_ao_vivo' },
        (payload) => {
          const statusBanco = String(payload.new.valor) === 'true';
          setAulaAtiva(statusBanco);
          if (payload.new.link) setLinkInput(payload.new.link);
        }
      )
      .subscribe();

    const channelAvisos = supabase
      .channel('admin-avisos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos' }, () => fetchAvisos())
      .subscribe();

    // Polling de segurança (Aumentado para 30s para evitar conflitos)
    const interval = setInterval(() => {
      fetchAlunos();
    }, 30000);

    // HEARTBEAT DO ADMIN (Para o admin também aparecer online)
    const heartbeat = setInterval(async () => {
      const id = localStorage.getItem("user-id");
      if (!id) return;
      await supabase
        .from("alunos")
        .update({ ultima_atividade: new Date().toISOString() })
        .eq("id", id);
    }, 15000);

    return () => {
      supabase.removeChannel(channelAlunos);
      supabase.removeChannel(channelConfig);
      supabase.removeChannel(channelAvisos);
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [fetchAlunos, carregarStatusAula, fetchAvisos]);

  const criarAviso = async () => {
    if (!novoAviso.titulo || !novoAviso.conteudo) {
      avisarIA("Preencha o título e o conteúdo do aviso.");
      return;
    }
    const { error } = await supabase.from("avisos").insert([novoAviso]);
    if (!error) {
      avisarIA("📢 Aviso publicado!");
      setNovoAviso({ titulo: "", conteudo: "", tipo: "info" });
      fetchAvisos();
    }
  };

  const excluirAviso = async (id: string) => {
    await supabase.from("avisos").delete().eq("id", id);
    fetchAvisos();
  };


  const liberar = async (id: string, tipo: 'aluno' | 'admin' | 'pendente') => {
    const updateData = {
      status: tipo === 'pendente' ? 'pendente' : 'ativo',
      role: tipo === 'admin' ? 'admin' : 'aluno'
    };

    const { error } = await supabase
      .from('alunos')
      .update(updateData)
      .eq('id', id);

    if (error) {
      avisarIA("Erro ao atualizar: " + error.message);
    } else {
      avisarIA(`✅ Usuário atualizado!`);
      fetchAlunos();
    }
  };

  const abrirAulaOnline = async () => {
    if (!linkInput.trim()) {
      avisarIA("Cole o link da reunião.");
      return;
    }

    setLoading(true);
    // 1. Atualizamos o banco pelo ID exato (visto no seu print como ID 3)
    const { error } = await supabase
      .from('configuracoes')
      .update({ valor: "true", link: linkInput.trim() })
      .eq('id', 3); // Usando ID direto para evitar erro de busca

    if (error) {
      console.error("Erro Supabase:", error);
      avisarIA("Erro ao iniciar: " + error.message);
      setLoading(false);
    } else {
      setAulaAtiva(true);
      avisarIA("🟢 Aula Ativada no Banco!");
      window.open(linkInput.trim(), "_blank");
      setLoading(false);
    }
  };

  const encerrarAula = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('configuracoes')
      .update({ valor: "false" })
      .eq('id', 3);

    if (error) {
      avisarIA("Erro ao encerrar.");
    } else {
      setAulaAtiva(false);
      avisarIA("📴 Aula encerrada no Banco.");
    }
    setLoading(false);
  };

  const isOnline = (ultimaAtiv: string | null | undefined) => {
    if (!ultimaAtiv) return false;
    const dataAtividade = new Date(ultimaAtiv);
    const agora = new Date();
    const diffInMs = Math.abs(agora.getTime() - dataAtividade.getTime());
    const diffInMinutes = diffInMs / (1000 * 60);
    return diffInMinutes < 5;
  };

  const exportarPlanilha = () => {
    const ws = XLSX.utils.json_to_sheet(alunos.map(a => ({
      Nome: a.nome,
      CPF: a.cpf,
      Status: a.status,
      XP: a.xp,
      Aulas: a.aulas_concluidas?.length || 0
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alunos");
    XLSX.writeFile(wb, "Relatorio_Alunos.xlsx");
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.cpf?.includes(busca)
  );

  return (
    <div style={{ minHeight: "100vh", background: "#08090A", color: "#F0E8D8", display: "flex", flexDirection: "column" }}>

      <header style={{ padding: "20px 40px", background: "#0D0E11", borderBottom: "1px solid rgba(200,169,110,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: "#C8A96E", padding: "10px", borderRadius: "8px" }}>
            <Car size={24} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: "bold" }}>CENTRAL DO <span style={{ color: "#C8A96E" }}>ADMIN</span></h1>
            <p style={{ fontSize: "11px", color: "#5CBF8A", margin: 0, opacity: 0.8 }}>
              ● {alunos.filter(a => isOnline(a.ultima_atividade)).length} Online | Supabase: {realtimeStatus}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input
            type="url"
            placeholder="Link da Aula (Meet/Zoom)"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            style={inputLinkStyle}
          />

          <button
            onClick={aulaAtiva ? encerrarAula : abrirAulaOnline}
            disabled={loading}
            style={{ ...btnStyle, background: aulaAtiva ? "#E05C5C" : "#2D8CFF", opacity: loading ? 0.7 : 1 }}
          >
            {aulaAtiva ? "ENCERRAR AULA" : "INICIAR AULA"}
          </button>

          <button onClick={() => { fetchAlunos(); carregarStatusAula(); }} style={iconBtnStyle} title="Sincronizar">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button onClick={exportarPlanilha} style={iconBtnStyle} title="Exportar Excel">
            <Download size={18} />
          </button>

          <button onClick={() => { localStorage.clear(); router.push("/"); }} style={{ ...iconBtnStyle, color: "#E05C5C" }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "40px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <StatCard icon={<Users color="#C8A96E" />} title="Total" value={alunos.length} />
          <StatCard icon={<CheckCircle color="#5CBF8A" />} title="Ativos" value={alunos.filter(a => a.status === 'ativo').length} />
          <StatCard icon={<Clock color="#E05C5C" />} title="Pendentes" value={alunos.filter(a => a.status === 'pendente').length} />
        </div>

        <div style={{ marginBottom: "25px", position: "relative", maxWidth: "500px" }}>
          <Search style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} size={20} />
          <input
            type="text"
            placeholder="Filtrar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={searchStyle}
          />
        </div>

        <div style={{ background: "#0D0E11", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(200,169,110,0.03)", color: "#C8A96E", textAlign: "left" }}>
                <th style={thStyle}>ONLINE</th>
                <th style={thStyle}>ALUNO / CPF</th>
                <th style={thStyle}>PROGRESSO</th>
                <th style={thStyle}>XP / NÍVEL</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {alunosFiltrados.map((aluno) => {
                const totalAulas = 30;
                const aulasConcluidas = aluno.aulas_concluidas?.length || 0;
                const pct = Math.min(Math.round((aulasConcluidas / totalAulas) * 100), 100);

                return (
                  <tr key={aluno.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={tdStyle}>
                      <div style={{
                        width: "12px", height: "12px", borderRadius: "50%",
                        background: isOnline(aluno.ultima_atividade) ? "#5CBF8A" : "#222",
                        boxShadow: isOnline(aluno.ultima_atividade) ? "0 0 15px rgba(92,191,138,0.5)" : "none"
                      }} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "bold" }}>{aluno.nome}</div>
                      <div style={{ fontSize: "12px", opacity: 0.4 }}>{aluno.cpf}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ width: "100px", height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", marginBottom: "5px" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#C8A96E" }} />
                      </div>
                      <span style={{ fontSize: "11px", opacity: 0.6 }}>{pct}% ({aulasConcluidas} aulas)</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: "#C8A96E", fontWeight: "bold" }}>{aluno.xp || 0} XP</div>
                      <div style={{ fontSize: "11px", opacity: 0.5 }}>{aluno.nivel || "Recruta"}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                        background: aluno.status === 'ativo' ? "rgba(92,191,138,0.1)" : "rgba(224,92,92,0.1)",
                        color: aluno.status === 'ativo' ? "#5CBF8A" : "#E05C5C"
                      }}>
                        {aluno.status?.toUpperCase() || "PENDENTE"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => liberar(aluno.id, 'aluno')} style={iconBtnStyle} title="Liberar Aluno">
                          <CheckCircle color="#5CBF8A" size={20} />
                        </button>
                        <button onClick={() => liberar(aluno.id, 'admin')} style={iconBtnStyle} title="Tornar Admin">
                          <ShieldCheck color="#C8A96E" size={20} />
                        </button>
                        <button onClick={() => liberar(aluno.id, 'pendente')} style={iconBtnStyle} title="Bloquear">
                          <XCircle color="#E05C5C" size={20} />
                        </button>
                        <button onClick={async () => { if (confirm("Excluir?")) { await supabase.from('alunos').delete().eq('id', aluno.id); fetchAlunos(); } }} style={iconBtnStyle}>
                          <Trash2 color="#555" size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      {/* SEÇÃO DO MURAL DE AVISOS */}
      <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        
        {/* FORMULÁRIO DE CRIAR AVISO */}
        <div style={{ background: "#0D0E11", padding: "25px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontSize: "18px", color: "#C8A96E", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={20} /> PUBLICAR NO MURAL
          </h2>
          
          <input 
            placeholder="Título do Aviso" 
            value={novoAviso.titulo}
            onChange={e => setNovoAviso({...novoAviso, titulo: e.target.value})}
            style={{ ...searchStyle, padding: "12px", marginBottom: "15px" }}
          />
          
          <textarea 
            placeholder="Mensagem para os alunos..." 
            value={novoAviso.conteudo}
            onChange={e => setNovoAviso({...novoAviso, conteudo: e.target.value})}
            style={{ ...searchStyle, padding: "12px", marginBottom: "15px", height: "100px", resize: "none", fontFamily: "inherit" }}
          />
          
          <select 
            value={novoAviso.tipo}
            onChange={e => setNovoAviso({...novoAviso, tipo: e.target.value})}
            style={{ ...searchStyle, padding: "12px", marginBottom: "20px", appearance: "none" }}
          >
            <option value="info">ℹ️ Informativo (Azul)</option>
            <option value="urgente">🚨 Urgente (Vermelho)</option>
            <option value="sucesso">✅ Conquista (Verde)</option>
          </select>

          <button onClick={criarAviso} style={{ ...btnStyle, background: "#C8A96E", width: "100%" }}>
            POSTAR NO MURAL
          </button>
        </div>

        {/* LISTA DE AVISOS ATUAIS */}
        <div style={{ background: "#0D0E11", padding: "25px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontSize: "18px", color: "#C8A96E", marginBottom: "20px" }}>AVISOS ATIVOS</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "400px", overflowY: "auto" }}>
            {avisos.length === 0 && <p style={{ opacity: 0.3, textAlign: "center" }}>Nenhum aviso no mural.</p>}
            {avisos.map(aviso => (
              <div key={aviso.id} style={{ 
                padding: "15px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", 
                borderLeft: `4px solid ${aviso.tipo === 'urgente' ? '#E05C5C' : aviso.tipo === 'sucesso' ? '#5CBF8A' : '#2D8CFF'}`,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start"
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{aviso.titulo}</h4>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.7 }}>{aviso.conteudo}</p>
                </div>
                <button onClick={() => excluirAviso(aviso.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}>
                  <Trash2 size={16} color="#E05C5C" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: any, title: string, value: any }) {
  return (
    <div style={{ background: "#0D0E11", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "20px", alignItems: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "10px" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "12px", opacity: 0.5, textTransform: "uppercase" }}>{title}</p>
        <h3 style={{ margin: "5px 0 0 0", fontSize: "24px", fontWeight: "bold" }}>{value}</h3>
      </div>
    </div>
  );
}

const thStyle = { padding: "18px 25px", fontSize: "11px", letterSpacing: "1px" };
const tdStyle = { padding: "18px 25px" };
const inputLinkStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "12px 15px", fontSize: "13px", outline: "none", width: "260px" };
const searchStyle = { width: "100%", padding: "15px 15px 15px 45px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", outline: "none", fontSize: "14px" };
const btnStyle = { color: '#000', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold' as const, border: 'none', cursor: 'pointer', fontSize: '13px' };
const iconBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };