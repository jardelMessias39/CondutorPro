
"use client";
import React, { useState, useEffect } from "react";

export default function NotificationIA() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mostrarMensagem = (e: any) => {
      setMsg(e.detail);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000); // Some após 5 segundos
    };

    window.addEventListener("ia-notificacao", mostrarMensagem);
    return () => window.removeEventListener("ia-notificacao", mostrarMensagem);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", 
      top: "20px", 
      left: "50%", 
      transform: "translateX(-50%)",
      background: "rgba(22, 23, 29, 0.85)", 
      backdropFilter: "blur(10px)", // Efeito de vidro
      border: "1px solid rgba(200, 169, 110, 0.4)",
      padding: "12px 20px", 
      borderRadius: "16px", 
      zIndex: 10000,
      display: "flex", 
      alignItems: "center", 
      gap: "15px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(200, 169, 110, 0.1)",
      animation: "fadeInDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    }}>
      <div style={{ 
        background: "#C8A96E", 
        width: "35px", 
        height: "35px", 
        borderRadius: "50%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: "20px",
        boxShadow: "0 0 15px rgba(200, 169, 110, 0.4)"
      }}>
        🤖
      </div>
      <div>
        <p style={{ margin: 0, color: "#C8A96E", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
          Sistema CondutorPro
        </p>
        <p style={{ margin: 0, color: "#F0E8D8", fontSize: "14px", fontWeight: "500" }}>{msg}</p>
      </div>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -30px) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}