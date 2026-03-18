
"use client"
import { FileSpreadsheet } from "lucide-react";

interface Aluno {
  nome: string;
  cpf: string;
  email: string;
  status: string;
}
const calcularIdade = (dataString: string) => {
  if (!dataString) return "";

  const hoje = new Date();
  const [ano, mes, dia] = dataString.split("-").map(Number);

  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();

  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
    idade--;
  }

  return idade;
};

export default function BotaoRelatorio({ alunos }: { alunos: Aluno[] }) {
  const exportarCSV = () => {
    if (alunos.length === 0) {
      alert("Não há alunos para exportar.");
      return;
    }

    // Cabeçalho do Excel (CSV)
   const cabecalho = "Nome;CPF;Email;Status;Idade\n";
    
    // Transforma a lista de alunos em linhas de texto
const linhas = alunos.map(aluno => 
  `${aluno.nome.toUpperCase()};${aluno.cpf};${aluno.email};${aluno.status.toUpperCase()};${calcularIdade(aluno.data_nascimento)}`
).join("\n");

    const corpoDoArquivo = cabecalho + linhas;
    
    // Cria o arquivo para download
    const blob = new Blob(["\ufeff" + corpoDoArquivo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.setAttribute("download", `relatorio_alunos_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={exportarCSV}
      style={{
        background: "rgba(200,169,110,0.1)",
        border: "1px solid #C8A96E",
        color: "#C8A96E",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: "bold",
        transition: "0.3s"
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "rgba(200,169,110,0.2)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "rgba(200,169,110,0.1)")}
    >
      <FileSpreadsheet size={18} />
      BAIXAR PLANILHA
    </button>
  );
}