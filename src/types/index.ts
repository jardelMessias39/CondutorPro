export interface Questao {
  pergunta: string;
  opcoes: string[];
  correta: number;
  categoria: string;
}

export interface Video {
  id: string;
  titulo: string;
  url?: string;
  youtubeId?: string;
  categoria: string;
  duracao: number;
  duracaoSegundos?: number;
  descricao?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  status: "ativo" | "inativo" | "aguarde" | "pendente";
  role: "admin" | "aluno";
  id_sessao: string;
  created_at: string;
  ultima_atividade: string;
  xp?: number;
  nivel?: number;
  aulas_concluidas?: string[];
  historico_simulados?: { nota: number; data: string }[];
}

export interface Configuracao {
  chave: string;
  valor: string;
  link?: string;
}

export interface ResultadoSimulado {
  id: string;
  aluno_id: string;
  pontuacao: number;
  total: number;
  tempo_segundos: number;
  categorias_erradas: string[];
  created_at: string;
}

export interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  criterio: string;
}

export interface Streak {
  id: string;
  aluno_id: string;
  dias_consecutivos: number;
  ultimo_dia: string;
}