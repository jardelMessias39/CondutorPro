"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Car, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CourseHeaderProps {
  activePage: "Dashboard" | "Aulas" | "Simulados" | "Progresso" | "Quizzes" | "Biblioteca";
}

export default function CourseHeader({ activePage }: CourseHeaderProps) {
  const [tema, setTema] = useState("dark");
  const [userName, setUserName] = useState("Aluno");
  const router = useRouter();

  // 1. CARREGAR PREFERÊNCIAS (Nome e Tema salvo)
  useEffect(() => {
    const savedName = localStorage.getItem("user-name");
    if (savedName) setUserName(savedName);

    const savedTheme = localStorage.getItem("tema-condutor");
    if (savedTheme) {
      setTema(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  // 2. HEARTBEAT GLOBAL — atualiza o status online em QUALQUER página do sistema
  useEffect(() => {
    const executarHeartbeat = async () => {
      const id = localStorage.getItem("user-id");
      if (!id) return;
      await supabase
        .from("alunos")
        .update({ ultima_atividade: new Date().toISOString() })
        .eq("id", id);
    };

    // Dispara imediatamente ao entrar em qualquer página
    executarHeartbeat();

    // Repete a cada 20 segundos
    const interval = setInterval(executarHeartbeat, 20000);

    // Atualiza quando o aluno volta para a aba
    const handleFocus = () => executarHeartbeat();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // 2. FUNÇÃO PARA TROCAR O TEMA E SALVAR
  const toggleTheme = () => {
    const novoTema = tema === "dark" ? "light" : "dark";
    setTema(novoTema);
    document.documentElement.setAttribute("data-theme", novoTema);
    localStorage.setItem("tema-condutor", novoTema);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Aulas", path: "/aulas" },
    { name: "Simulados", path: "/simulados" },
    { name: "Progresso", path: "/progresso" },
    { name: "Quizzes", path: "/quiz" },
    { name: "Biblioteca", path: "/biblioteca" },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border)", // USANDO VARIÁVEL
      padding: "15px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--background)", // USANDO VARIÁVEL
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      width: "100%"
    }} className="nav-principal">
      
      {/* BOTÃO DE TEMA */}
      <button 
        onClick={toggleTheme} 
        style={{ cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center" }}
        title="Alternar modo claro/escuro"
      >
        {tema === "dark" ? (
          <Moon color="var(--primary)" size={24} /> 
        ) : (
          <Sun color="var(--primary)" size={24} />
        )}
      </button>

      {/* 1. LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Car size={28} color="var(--primary)" />
        <span style={{ 
          fontSize: 18, 
          letterSpacing: "0.15em", 
          color: "var(--primary)", 
          fontWeight: "bold",
          fontFamily: "serif" 
        }}>
          CONDUTOR<span style={{ color: "var(--foreground)", opacity: 0.9 }}>PRO</span>
        </span>
      </div>

      {/* 2. NAVEGAÇÃO */}
      <nav style={{ display: "flex", gap: "32px" }} className="container-filtros">
        {menuItems.map(item => {
          const isActive = activePage === item.name;
          return (
            <Link key={item.name} href={item.path} style={{ textDecoration: "none" }}>
              <span style={{
                fontSize: 16,
                letterSpacing: "0.12em",
                color: isActive ? "var(--primary)" : "var(--foreground)",
                opacity: isActive ? 1 : 0.6,
                textTransform: "uppercase",
                borderBottom: isActive ? "2px solid var(--primary)" : "none",
                paddingBottom: 4,
                transition: "all 0.3s ease",
                fontWeight: isActive ? "bold" : "normal",
                display: "inline-block"
              }}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. PERFIL */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0, fontWeight: "500" }}>
            {userName}
          </p>
          <button 
            onClick={handleLogout}
            style={{ 
              background: "none", border: "none", color: "var(--primary)", 
              fontSize: "11px", cursor: "pointer", display: "flex", 
              alignItems: "center", gap: "5px", padding: 0, marginLeft: "auto"
            }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>

        <div style={{ 
          width: "38px", height: "38px", borderRadius: "50%", 
          background: "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center", 
          color: "var(--background)", fontWeight: "bold", fontSize: "16px",
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}