"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Users, CheckCircle, XCircle, Trash2, 
  ShieldCheck, Trophy, BookOpen, BarChart3,
  LogOut, Download, Video, Car, Search
} from "lucide-react";
import * as XLSX from "xlsx";


const avisarIA = (mensagem: string) => {
    window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: mensagem }));
  };

export default function AdminPage() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAlunos();
    // REALTIME: Atualiza a lista sozinho se houver mudanças no banco
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => fetchAlunos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAlunos = async () => {
    const { data } = await supabase.from("alunos").select("*").order("created_at", { ascending: false });
    if (data) setAlunos(data);
    setLoading(false);
  };

  const abrirAulaOnline = async () => {
 const linkAula = "https://meet.google.com/thb-yybc-wnv";

  if (!linkAula) return;

  await supabase
    .from('configuracoes')
    .update({
      valor: true,
      link: linkAula
    })
    .eq('chave', 'aula_ao_vivo');

  window.open(linkAula, "_blank"); // admin entra primeiro
};
// ENCERRAR A AULA
const encerrarAula = async () => {
  console.log("Tentando encerrar a aula...");

  const { data, error } = await supabase
    .from('configuracoes')
    .update({ valor: false })
    .eq('chave', 'aula_ao_vivo')
    .select(); // 👈 ISSO AQUI É O SEGREDO

  console.log("RESULTADO:", data);

  if (error) {
    console.error("Erro ao encerrar:", error.message);
  } else {
    console.log("Atualizado no banco:", data);
  }
};

  const exportarPlanilha = () => {
    if (alunos.length === 0) return alert("Sem dados para exportar");
    const ws = XLSX.utils.json_to_sheet(alunos.map(a => ({
      Nome: a.nome,
      CPF: a.cpf,
      Status: a.status,
      XP: a.xp,
      Aulas: a.aulas_concluidas?.length || 0
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alunos");
    XLSX.writeFile(wb, "Relatorio_CondutorPro.xlsx");
  };

  const isOnline = (ultimaAtiv: string) => {
    if (!ultimaAtiv) return false;
    const minutos = (new Date().getTime() - new Date(ultimaAtiv).getTime()) / 60000;
    return minutos < 5;
  };

  // Filtragem em tempo real
  const alunosFiltrados = alunos.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) || 
    a.cpf.includes(busca)
  );

  const alunosOnlineCount = alunos.filter(a => isOnline(a.ultima_atividade)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", color: "#F0E8D8", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER */}
      <header style={{ padding: "20px 40px", background: "#121318", borderBottom: "1px solid rgba(200,169,110,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#C8A96E", padding: "8px", borderRadius: "6px" }}>
            <Car size={20} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>ADMIN <span style={{ color: "#C8A96E" }}>CONTROL</span></h1>
            <p style={{ fontSize: "10px", color: "#5CBF8A", margin: 0 }}>● {alunosOnlineCount} Alunos Online</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
  {/* Botão de Iniciar */}
  <button 
    onClick={abrirAulaOnline} 
    style={{ background: '#2D8CFF', color: '#fff', padding: '10px' }}
  >
    INICIAR AULA ONLINE
  </button>

  {/* NOVO: Botão de Encerrar (isso vai ativar a função que está 'apagada') */}
  <button 
    onClick={encerrarAula} 
    style={{ background: '#FF4D4D', color: '#fff', padding: '10px' }}
  >
    ENCERRAR AULA
  </button>

          
          <button onClick={exportarPlanilha} style={secondaryButtonStyle}>
            <Download size={18} /> PLANILHA
          </button>
          
          <button onClick={() => { localStorage.clear(); router.push("/"); }} style={{ ...secondaryButtonStyle, color: "#E05C5C" }}>
            <LogOut size={18} /> SAIR
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "30px" }}>
        
        {/* BARRA DE BUSCA */}
        <div style={{ marginBottom: "20px", position: "relative", maxWidth: "400px" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={18} />
          <input 
            type="text" 
            placeholder="Buscar aluno por nome ou CPF..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={inputBuscaStyle}
          />
        </div>

        {/* TABELA */}
        <div style={{ background: "#121318", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(200,169,110,0.05)", color: "#C8A96E", textAlign: "left" }}>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>ALUNO / CPF</th>
                <th style={thStyle}>PROGRESSO</th>
                <th style={thStyle}>XP / NÍVEL</th>
                <th style={thStyle}>SIMULADOS</th>
                <th style={thStyle}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <td style={tdStyle}>
                    <div style={{ 
                      width: "10px", height: "10px", borderRadius: "50%", 
                      background: isOnline(aluno.ultima_atividade) ? "#5CBF8A" : "#333",
                      boxShadow: isOnline(aluno.ultima_atividade) ? "0 0 10px #5CBF8A" : "none" 
                    }} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "bold" }}>{aluno.nome}</div>
                    <div style={{ fontSize: "11px", opacity: 0.4 }}>{aluno.cpf}</div>
                  </td>
                  <td style={tdStyle}>{aluno.aulas_concluidas?.length || 0} aulas</td>
                  <td style={tdStyle}>
                    <div style={{ color: "#C8A96E" }}>{aluno.xp} XP</div>
                    <div style={{ fontSize: "10px", opacity: 0.5 }}>{aluno.nivel}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <BarChart3 size={14} color="#5C8FE0" />
                      {aluno.historico_simulados?.length || 0} feitos
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <button onClick={async () => {
                        const novoStatus = aluno.status === 'ativo' ? 'pendente' : 'ativo';
                        await supabase.from('alunos').update({ status: novoStatus }).eq('id', aluno.id);
                      }} style={actionButtonStyle}>
                        {aluno.status === 'ativo' ? <XCircle color="#E05C5C" size={20} /> : <ShieldCheck color="#5CBF8A" size={20} />}
                      </button>
                      <button onClick={async () => {
                        if(confirm("Excluir aluno?")) await supabase.from('alunos').delete().eq('id', aluno.id);
                      }} style={actionButtonStyle}>
                        <Trash2 color="#555" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer style={{ padding: "30px", borderTop: "1px solid rgba(200,169,110,0.1)", textAlign: "center" }}>
        <p style={{ color: "#C8A96E", fontSize: "12px", opacity: 0.6 }}>
          © 2026 CONDUTORPRO — DESENVOLVIDO POR JARDEL MESSIAS
        </p>
      </footer>
    </div>
  );
}

// ESTILOS
const thStyle = { padding: "15px 20px", fontSize: "11px", textTransform: "uppercase" as const };
const tdStyle = { padding: "15px 20px", fontSize: "14px" };
const actionButtonStyle = { background: "none", border: "none", cursor: "pointer" };
const inputBuscaStyle = {
  width: "100%", padding: "12px 12px 12px 40px", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none"
};
const secondaryButtonStyle = { 
  display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", 
  borderRadius: "8px", fontSize: "13px", fontWeight: "bold" as const, 
  cursor: "pointer", background: "rgba(255,255,255,0.03)", 
  border: "1px solid rgba(255,255,255,0.1)", color: "#F0E8D8" 
};