"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Car, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function NovaSenha() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pronto, setPronto] = useState(false); // sessão de recovery ativa?
  const [sucesso, setSucesso] = useState(false);
  const router = useRouter();

  // O Supabase envia o token de recovery como hash na URL (#access_token=...&type=recovery).
  // Precisamos detectar esse evento para estabelecer a sessão antes de atualizar a senha.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Sessão de recovery ativa — libera o formulário
        setPronto(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const atualizar = async () => {
    if (!senha || senha.length < 6) {
      window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: "A senha deve ter pelo menos 6 caracteres." }));
      return;
    }
    if (senha !== confirmar) {
      window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: "As senhas não coincidem." }));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);

    if (error) {
      window.dispatchEvent(new CustomEvent("ia-notificacao", { detail: "Erro: " + error.message }));
    } else {
      setSucesso(true);
      setTimeout(() => router.push("/"), 3000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0E11", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "serif" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
        <Car size={24} color="#C8A96E" />
        <span style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px", color: "#F0E8D8" }}>
          CONDUTOR<span style={{ color: "#C8A96E" }}>PRO</span>
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: "420px", background: "rgba(255,255,255,0.02)", padding: "40px", borderRadius: "12px", border: "1px solid rgba(200,169,110,0.15)" }}>

        {sucesso ? (
          /* Tela de sucesso */
          <div style={{ textAlign: "center" }}>
            <ShieldCheck size={60} color="#5CBF8A" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ color: "#5CBF8A", margin: "0 0 10px" }}>Senha atualizada!</h2>
            <p style={{ color: "rgba(240,232,216,0.6)", fontSize: "14px" }}>
              Redirecionando para o login...
            </p>
          </div>
        ) : !pronto ? (
          /* Aguardando o token de recovery chegar */
          <div style={{ textAlign: "center" }}>
            <Loader2 className="animate-spin" size={40} color="#C8A96E" style={{ margin: "0 auto 20px" }} />
            <h2 style={{ color: "#F0E8D8", margin: "0 0 10px", fontWeight: "normal" }}>Validando link...</h2>
            <p style={{ color: "rgba(240,232,216,0.5)", fontSize: "13px" }}>
              Se nada acontecer, o link pode ter expirado.<br />
              <span
                onClick={() => router.push("/")}
                style={{ color: "#C8A96E", cursor: "pointer", textDecoration: "underline" }}
              >
                Solicitar novo link
              </span>
            </p>
          </div>
        ) : (
          /* Formulário principal */
          <>
            <h2 style={{ color: "#F0E8D8", margin: "0 0 8px", fontWeight: "normal", fontSize: "24px" }}>
              Criar nova senha
            </h2>
            <p style={{ color: "rgba(240,232,216,0.5)", fontSize: "13px", marginBottom: "30px" }}>
              Escolha uma senha segura para sua conta.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Campo nova senha */}
              <div style={{ position: "relative" }}>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "15px 45px 15px 15px", color: "#fff", outline: "none", borderRadius: "6px", boxSizing: "border-box" as const }}
                />
                <button
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#C8A96E" }}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Campo confirmar senha */}
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Confirmar nova senha"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${confirmar && confirmar !== senha ? "rgba(224,92,92,0.6)" : "rgba(255,255,255,0.1)"}`, padding: "15px", color: "#fff", outline: "none", borderRadius: "6px", boxSizing: "border-box" as const }}
              />

              <button
                onClick={atualizar}
                disabled={loading}
                style={{ background: "#C8A96E", color: "#0D0E11", border: "none", padding: "18px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "14px", letterSpacing: "1px" }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "SALVAR NOVA SENHA"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}