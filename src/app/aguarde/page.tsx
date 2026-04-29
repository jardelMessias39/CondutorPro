"use client";

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, MessageCircle, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase"; // 🔥 FALTAVA ISSO

export default function AguardePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Isso garante que a página só renderize as animações no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
  const userId = localStorage.getItem("user-id");

  if (!userId) return;

  const channel = supabase
    .channel('aguarde-status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'alunos',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        const novo = payload.new as { status: string };

        if (novo.status === 'ativo') {
          window.dispatchEvent(new CustomEvent("ia-notificacao", {
            detail: "🚀 Acesso liberado! Entrando..."
          }));

          router.push("/dashboard");
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const handleSair = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0D0E11", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "20px",
      fontFamily: "serif" 
    }}>
      <div style={{ 
        maxWidth: "500px", 
        width: "100%", 
        textAlign: "center", 
        background: "rgba(255,255,255,0.02)", 
        padding: "60px 40px", 
        borderRadius: "20px", 
        border: "1px solid rgba(200,169,110,0.2)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        
        <div style={{ marginBottom: "30px", display: "inline-block", position: "relative" }}>
          {/* Removi a animação complexa daqui para evitar erro de CSS */}
          <Clock size={60} color="#C8A96E" />
        </div>

        <h1 style={{ color: "#F0E8D8", fontSize: "28px", marginBottom: "15px" }}>
          Matrícula em <span style={{ color: "#C8A96E" }}>Análise</span>
        </h1>
        
        <p style={{ color: "rgba(232,224,208,0.7)", lineHeight: "1.6", fontSize: "16px", marginBottom: "40px" }}>
          Olá! Recebemos seus dados com sucesso. Para sua segurança e da Autoescola, 
          um administrador está revisando sua matrícula para liberar seu acesso às aulas.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <a 
            href="https://wa.me/5579999999999" // ⚠️ COLOQUE O NUMERO REAL AQUI
            target="_blank"
            style={{ 
              background: "#C8A96E", 
              color: "#0D0E11", 
              textDecoration: "none", 
              padding: "15px", 
              borderRadius: "8px", 
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}
          >
            <MessageCircle size={20} /> FALAR COM A SECRETARIA
          </a>

          <button 
            onClick={handleSair}
            style={{ 
              background: "transparent", 
              color: "#C8A96E", 
              border: "1px solid rgba(200,169,110,0.3)", 
              padding: "12px", 
              borderRadius: "8px", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "10px"
            }}
          >
            <LogOut size={18} /> SAIR DA CONTA
          </button>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: 0.5 }}>
          <ShieldCheck size={16} />
          <span style={{ fontSize: "12px", letterSpacing: "1px" }}>SISTEMA SEGURO CONDUTORPRO</span>
        </div>
      </div>
    </div>
  );
}