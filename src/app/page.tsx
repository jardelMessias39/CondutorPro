"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle, Award, Car, LogIn, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

function emailValido(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Máscara de CPF para 11 números
const formatarCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const router = useRouter();

  const avisarIA = (mensagem: string) => {
    window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: mensagem }));
  };

  const validarIdade = (dataString: string) => {
    if (!dataString) return false;
    const hoje = new Date();
    const nasc = new Date(dataString);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade >= 18;
  };

  const recuperarSenha = async () => {
    if (!emailValido(email)) {
      avisarIA("Digite seu e-mail para enviarmos o link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`
    });
    if (error) avisarIA("Erro ao enviar: " + error.message);
    else avisarIA("E-mail enviado! Verifique sua caixa de entrada.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

   if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error || !data.user) {
    avisarIA("E-mail ou senha incorretos.");
    setLoading(false);
    
    return;
  }

  const user = data.user;

  // 🔥 busca dados extras do aluno
  const { data: aluno, error: erroAluno } = await supabase
    .from("alunos")
    .select("*")
    .eq("id", user.id)
    .single();

if (erroAluno || !aluno) {
    avisarIA("Erro ao carregar dados do usuário.");
    setLoading(false);
    return;
  }

  const idSessao = crypto.randomUUID();
  localStorage.setItem("user-id", user.id);
  localStorage.setItem("user-name", aluno.nome);
  localStorage.setItem("user-role", aluno.role);
  localStorage.setItem("id-sessao", idSessao);

  await supabase.from("alunos").update({ id_sessao: idSessao }).eq("id", user.id);

  if (aluno.status === "aguarde") {
    router.push("/aguarde");
  } else if (aluno.role === "admin" || aluno.email === "jardel.messias.dev@gmail.com") {
    router.push("/admin");
  } else {
    router.push("/dashboard");
  }
}else {
  if (cpf.replace(/\D/g, "").length !== 11) {
    avisarIA("CPF inválido.");
    setLoading(false);
    return;
  }

  if (!validarIdade(dataNascimento)) {
    avisarIA("Apenas maiores de 18 anos.");
    setLoading(false);
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha
  });

  if (error || !data.user) {
    avisarIA("Erro: " + error?.message);
    setLoading(false);
    return;
  }

  const user = data.user;

  // 🔥 salva na tabela alunos
  const { error: erroAluno } = await supabase.from("alunos").insert([
    {
      id: user.id,
      nome,
      email,
      cpf,
      data_nascimento: dataNascimento,
      status: "pendente",
      role: "aluno",
      xp: 0,
      nivel: "Recruta"
    }
  ]);

  if (erroAluno) {
    avisarIA("Erro ao salvar dados.");
  } else {
    avisarIA("Cadastro feito! Verifique seu e-mail.");
    setIsLogin(true);
  }
}
setLoading(false);
};

  return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", color: "#F0E8D8", fontFamily: "serif" }}>

      {/* NAVBAR */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Car size={24} color="#C8A96E" />
          <span style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}>
            CONDUTOR<span style={{ color: "#C8A96E" }}>PRO</span>
          </span>
        </div>
      </nav>

      {/* CONTEÚDO DIVIDIDO */}
      <div style={{ display: "flex", flexWrap: "wrap", minHeight: "calc(100vh - 80px)" }}>

        {/* LADO ESQUERDO: DESIGN DE LUXO & INFOS */}
        <div style={{ flex: "1 1 600px", padding: "60px 5%", borderRight: "1px solid rgba(200,169,110,0.1)" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "normal", marginBottom: "40px", lineHeight: "1.1" }}>
            Sua CNH começa com a <br />
            <span style={{ color: "#C8A96E" }}>preparação de elite.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginBottom: "60px" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ background: "rgba(200,169,110,0.1)", padding: "12px", borderRadius: "8px" }}><Play size={20} color="#C8A96E" /></div>
              <h4 style={{ margin: 0, fontWeight: "normal" }}>Videoaulas em Alta Definição</h4>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div style={{ background: "rgba(200,169,110,0.1)", padding: "12px", borderRadius: "8px" }}><Award size={20} color="#C8A96E" /></div>
              <h4 style={{ margin: 0, fontWeight: "normal" }}>Sistema de Ranking e XP</h4>
            </div>
          </div>

          {/* LOCALIZAÇÃO (MAPA) */}
          <p style={{ color: "#C8A96E", fontSize: "14px", letterSpacing: "3px", fontWeight: "bold", marginBottom: "20px" }}>UNIDADE SIMÃO DIAS</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
            <div style={{ width: "100%", maxWidth: "500px", height: "300px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(200,169,110,0.2)" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.4728958252!2d-37.8105!3d-10.7439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ0JzM4LjAiUyAzN8KwNDgnMzcuOCJX!5e0!3m2!1spt-BR!2sbr!4v1625600000000!5m2!1spt-BR!2sbr"
                width="100%" height="100%" style={{ border: 0, filter: "grayscale(1) invert(0.9)" }} allowFullScreen loading="lazy"
              ></iframe>
            </div>
            <div>
              <p style={{ fontSize: "24px", margin: "0 0 10px 0" }}>Av. Principal, 456</p>
              <p style={{ color: "rgba(232,224,208,0.5)" }}>Centro, Simão Dias - SE</p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: O FORMULÁRIO */}
        <div style={{ flex: "1 1 400px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 5%", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ width: "100%", maxWidth: "450px", background: "rgba(255,255,255,0.02)", padding: "40px", borderRadius: "12px", border: "1px solid rgba(200,169,110,0.15)" }}>

            <div style={{ display: "flex", marginBottom: "35px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: "20px", background: "none", border: "none", color: isLogin ? "#C8A96E" : "rgba(255,255,255,0.2)", borderBottom: isLogin ? "2px solid #C8A96E" : "none", cursor: "pointer", fontWeight: "bold" }}>LOGIN</button>
              <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: "20px", background: "none", border: "none", color: !isLogin ? "#C8A96E" : "rgba(255,255,255,0.2)", borderBottom: !isLogin ? "2px solid #C8A96E" : "none", cursor: "pointer", fontWeight: "bold" }}>CADASTRO</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {!isLogin && (
                <>
                  <input type="text" placeholder="Nome Completo" required value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
                  <input type="text" placeholder="CPF" required value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} style={inputStyle} />
                  <div>
                    <label style={{ fontSize: "12px", color: "#C8A96E", marginBottom: "5px", display: "block" }}>Data de Nascimento</label>
                    <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} style={inputStyle} />
                  </div>
                </>
              )}

              <input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Senha" required value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />

              <button type="submit" disabled={loading} style={{ background: "#C8A96E", color: "#0D0E11", border: "none", padding: "20px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "ENTRAR NO SISTEMA" : "FINALIZAR MATRÍCULA")}
              </button>

              {isLogin && (
                <p onClick={recuperarSenha} style={{ cursor: "pointer", color: "#C8A96E", textAlign: "center", fontSize: "14px" }}>Esqueci minha senha</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* FOOTER LUXO */}
      <footer style={{ padding: "60px 40px", borderTop: "1px solid rgba(200,169,110,0.1)", textAlign: "center", background: "rgba(0,0,0,0.2)" }}>
        <p style={{ color: "#C8A96E", fontSize: "14px", letterSpacing: "2px" }}>
          © 2026 CONDUTORPRO — DESENVOLVIDO POR <span style={{ color: "#FFF" }}>JARDEL MESSIAS</span>
        </p>
        <p style={{ fontSize: "12px", opacity: 0.4, marginTop: "10px" }}>PLATAFORMA DE ENSINO INTELIGENTE PARA AUTOESCOLAS</p>
      </footer>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "#fff", outline: "none", boxSizing: "border-box" as const
};