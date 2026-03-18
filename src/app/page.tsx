"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle, Award, Car, LogIn, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";


function emailValido(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}


export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");


  const router = useRouter();

  // ADICIONE ESTA LINHA AQUI:
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    senha: "",
    dataNascimento: "" // O campo novo que criamos!
  });
  const validarIdade = (dataString: string) => {
  if (!dataString) return false;

  const hoje = new Date();
  const [ano, mes, dia] = dataString.split('-').map(Number);

  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();

  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
    idade--;
  }

  return idade >= 18;
};

const recuperarSenha = async () => {
  if (!email) {
    alert("Digite seu email primeiro");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:3000/nova-senha"
  });

  if (error) {
    avisarIA("Erro ao enviar email.");
  } else {
    avisarIA("Enviamos um link para redefinir sua senha.");
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const avisarIA = (mensagem: string) => {
      const evento = new CustomEvent("ia-notificacao", { detail: mensagem });
      window.dispatchEvent(evento);
    };

    // valida email
    if (!emailValido(email)) {
      avisarIA("Digite um email válido.");
      setLoading(false);
      return;
    }

    if (isLogin) {
      // 1. Buscamos todos os dados do usuário (inclusive a role e status)
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();

      if (error || !data) {
        // GATILHO IA: Erro de segurança
        avisarIA("IA detectou tentativa de acesso inválida. Verifique suas credenciais.");
        avisarIA("E-mail ou senha incorretos. Verifique seus dados.");
        setLoading(false);
        return;
      }

      // ✅ Login funcionou! Salvamos no navegador:
      localStorage.setItem("user-name", data.nome);
      localStorage.setItem("user-email", data.email);
      localStorage.setItem("user-id", data.id);

      // 🛡️ O "GUARDA DE TRÂNSITO" (Redirecionamento Inteligente):
      if (data.role === 'admin') {
        // GATILHO IA: Bem-vindo ao Admin
        avisarIA(`Bem-vindo, Comandante ${data.nome.split(' ')[0]}! Sincronizando painel de gestão.`);
        router.push("/admin");
      } else if (data.status === 'ativo') {
        // GATILHO IA: Bem-vindo ao Aluno
        avisarIA(`Olá, ${data.nome.split(' ')[0]}! Carregando suas aulas e progresso de XP.`);
        router.push("/dashboard");
      } else {
        // GATILHO IA: Aluno Pendente
        avisarIA("Acesso Restrito: Sua matrícula está em análise pela secretaria.");
        router.push("/aguarde");
      }

    } else {

      // 1. 🛡️ VALIDAÇÃO DE IDADE (O filtro da Autoescola)
      if (!validarIdade(formData.dataNascimento)) {
        avisarIA("❌ Cadastro bloqueado: O sistema detectou que você é menor de 18 anos.");
        avisarIA("Você precisa ter no mínimo 18 anos para tirar sua habilitação.");
        setLoading(false);
        return;
      }

      // 🔎 Verifica se o email já existe
      const { data: usuarioExistente } = await supabase
        .from("alunos")
        .select("email")
        .eq("email", email)
        .single();

      if (usuarioExistente) {
        avisarIA("Este email já está cadastrado.");
        setLoading(false);
        return;
      }

      // 3. ✅ SE PASSOU EM TUDO, FAZ O CADASTRO NO SUPABASE
      const { error } = await supabase
        .from('alunos')
        .insert([
          {
            nome,
            email,
            cpf,
            senha,
            data_nascimento: formData.dataNascimento, // ✅ certo
            status: 'pendente',
            role: 'aluno',
            xp: 0,
            nivel: 'Recruta'
          }
        ]);


      if (error) {
        avisarIA("Erro ao cadastrar: " + error.message);
      } else {
        avisarIA(`Parabéns, ${nome.split(' ')[0]}! Matrícula realizada. Aguarde a ativação.`);

        // O ANTÍDOTO PARA O LOOP:
        // Limpamos os estados ANTES de mudar para a tela de login

        // Limpa TODOS os campos
        setNome("");
        setEmail("");
        setCpf("");
        setSenha("");

        setFormData({
          email: "",
          nome: "",
          senha: "",
          dataNascimento: ""
        });

        // Aguarda 1 segundo pra IA aparecer bonito
        setTimeout(() => {
          setIsLogin(true);
        }, 1000);
      }


      setLoading(false);
    };


  };

    return (
      < div style={{ minHeight: "100vh", background: "#0D0E11", color: "#F0E8D8", fontFamily: "serif" }}>



        {/* NAVBAR */}
        <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(200,169,110,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Car size={24} color="#C8A96E" />
            <span style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}>
              CONDUTOR<span style={{ color: "#C8A96E" }}>PRO</span>
            </span>
          </div>
        </nav>

        {/* CONTAINER PRINCIPAL - AJUSTADO PARA RESPONSIVIDADE */}
        <div style={{
          display: "flex",
          flexWrap: "wrap", // ISSO FAZ O LOGIN IR PARA BAIXO NO CELULAR
          minHeight: "calc(100vh - 80px)"
        }}>

          {/* LADO ESQUERDO: MARKETING E INFOS */}
          <div style={{
            flex: "1 1 600px", // Base de 600px, mas encolhe/cresce
            padding: "40px 5%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(200,169,110,0.1)",
            boxSizing: "border-box"
          }}>

            {/* PARTE SUPERIOR: BENEFÍCIOS */}
            <div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "normal", marginBottom: "30px", lineHeight: "1.1" }}>
                Sua CNH começa com a <br />
                <span style={{ color: "#C8A96E" }}>preparação de elite.</span>
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginTop: "40px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ background: "rgba(200,169,110,0.1)", padding: "12px", borderRadius: "8px" }}><Play size={24} color="#C8A96E" /></div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "normal" }}>Videoaulas Dinâmicas</h4>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ background: "rgba(200,169,110,0.1)", padding: "12px", borderRadius: "8px" }}><CheckCircle size={24} color="#C8A96E" /></div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "normal" }}>Quizzes de Fixação</h4>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ background: "rgba(200,169,110,0.1)", padding: "12px", borderRadius: "8px" }}><Award size={24} color="#C8A96E" /></div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "normal" }}>Simulados Oficiais</h4>
                </div>
              </div>
            </div>

            {/* PARTE INFERIOR: MAPA E ENDEREÇO */}
            <div style={{ marginTop: "50px" }}>
              <p style={{ color: "#C8A96E", fontSize: "20px", letterSpacing: "2px", fontWeight: "bold", marginBottom: "20px" }}>
                VISITE NOSSA UNIDADE
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", alignItems: "flex-end" }}>
                {/* MAPA RESPONSIVO */}
                <div style={{
                  width: "100%",
                  maxWidth: "600px", // Limite para não ficar gigante no monitor
                  height: "350px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(200,169,110,0.3)"
                }}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15671.309062335!2d-37.0673479!3d-10.9184566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x71ab3a34651336f%3A0xc3b53c5f49e155b1!2sSimao%20Dias%2C%20SE!5e0!3m2!1spt-BR!2sbr!4v1709680000000"
                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
                  ></iframe>
                </div>

                {/* TEXTOS DE ENDEREÇO E REDES */}
                <div style={{ flex: "1 1 300px" }}>
                  <p style={{ fontSize: "clamp(24px, 4vw, 38px)", color: "#F0E8D8", marginBottom: "5px", fontWeight: "bold" }}>
                    Av. Principal, 456
                  </p>
                  <p style={{ fontSize: "clamp(18px, 3vw, 25px)", color: "rgba(232,224,208,0.6)", marginBottom: "20px" }}>
                    Centro, SIMÃO DIAS - SE
                  </p>

                  <div style={{ display: "flex", gap: "25px" }}>
                    <a href="#" style={{ color: "#C8A96E", fontSize: "20px", textDecoration: "none", fontWeight: "bold" }}>Instagram</a>
                    <a href="#" style={{ color: "#C8A96E", fontSize: "20px", textDecoration: "none", fontWeight: "bold" }}>Facebook</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: LOGIN / CADASTRO - RESPONSIVO */}
          <div style={{
            flex: "1 1 400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 5%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.01)"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "500px", // Reduzi um pouco para ficar mais elegante
              background: "rgba(255,255,255,0.02)",
              padding: "40px",
              borderRadius: "12px",
              border: "1px solid rgba(200,169,110,0.15)"
            }}>

              <div style={{ display: "flex", marginBottom: "35px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button
                  onClick={() => setIsLogin(true)}
                  style={{ flex: 1, padding: "20px", background: "none", border: "none", color: isLogin ? "#C8A96E" : "rgba(232,224,208,0.3)", borderBottom: isLogin ? "2px solid #C8A96E" : "none", cursor: "pointer", fontWeight: "bold" }}
                > LOGIN </button>
                <button
                  onClick={() => setIsLogin(false)}
                  style={{ flex: 1, padding: "20px", background: "none", border: "none", color: !isLogin ? "#C8A96E" : "rgba(232,224,208,0.3)", borderBottom: !isLogin ? "2px solid #C8A96E" : "none", cursor: "pointer", fontWeight: "bold" }}
                > CADASTRO </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>



                {!isLogin && (
                  <>
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                    />

                    <input
                      type="text"
                      placeholder="CPF"
                      required
                      autoComplete="off" // <--- ISSO AQUI impede o navegador de preencher sozinho
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "15px",
                        color: "#fff",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </>
                )}

                <input
                  type="email" placeholder="E-mail" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "var(--foreground)",
                    opacity: 0.8
                  }}>
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.dataNascimento} // Aqui ele busca do estado que criamos acima
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      background: "var(--card-bg)",
                      color: "var(--foreground)",
                      outline: "none",
                      fontSize: "16px" // Melhora o clique no celular
                    }}
                  />

                  {/* AVISO DE ERRO EM TEMPO REAL */}
                  {formData.dataNascimento && !validarIdade(formData.dataNascimento) && (
                    <p style={{
                      color: "#E05C5C",
                      fontSize: "12px",
                      marginTop: "8px",
                      fontWeight: "bold",
                      background: "rgba(224,92,92,0.1)",
                      padding: "8px",
                      borderRadius: "4px"
                    }}>
                      ⚠️ Você precisa ter 18 anos ou mais para tirar CNH.
                    </p>
                  )}
                </div>

                <input
                  type="password" placeholder="Senha" required
                  value={senha} onChange={(e) => setSenha(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: "#C8A96E", color: "#0D0E11", border: "none", padding: "20px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "10px" }}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    isLogin ?
                      <><LogIn size={18} /> ACESSAR CONTA</> :
                      <><UserPlus size={18} /> FINALIZAR MATRÍCULA</>
                  )}
                </button>
                {isLogin && (

                  <p
                    onClick={recuperarSenha}
                    style={{
                      cursor: "pointer",
                      color: "#C8A96E",
                      textAlign: "center",
                      fontSize: "14px",
                      marginTop: "10px"
                    }}
                  >

                    Esqueci minha senha

                  </p>

                )}

              </form>

            </div>
          </div>
        </div>
        <footer style={{
          marginTop: "50px",
          padding: "30px 20px",
          borderTop: "1px solid rgba(200,169,110,0.1)",
          textAlign: "center",
          background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)"
        }}>
          {/* Mudamos de <p> para <div> aqui para evitar o erro de nesting */}
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

            {/* Agora a DIV do contato está segura aqui dentro */}
            <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(200,169,110,0.6)" }}>
              CONTATO: (XX) 998061093
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
  };