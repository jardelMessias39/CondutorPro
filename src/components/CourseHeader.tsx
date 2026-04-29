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

  // 2. SEGURANÇA & HEARTBEAT — Proteção global do sistema
  useEffect(() => {
    const verificarSeguranca = async () => {
      const userId = localStorage.getItem("user-id");
      const sessaoLocal = localStorage.getItem("id-sessao");
      const userRole = localStorage.getItem("user-role");

      if (!userId) return;

      // Heartbeat: Atualiza status online
      try {
        await supabase
          .from("alunos")
          .update({
            ultima_atividade: new Date().toISOString() // Mantém o padrão ISO que o Admin lê
          })
          .eq("id", userId);
      } catch (e) {
        console.error("Erro no heartbeat:", e);
      }
      // Validação de Sessão Única e Status Ativo
      if (userRole !== 'admin') {
        const { data: aluno, error } = await supabase
          .from('alunos')
          .select('id_sessao, status')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao validar sessão:", error);
          return;
        }

        if (aluno) {
          // 1. Bloqueio de alunos não autorizados (Pendente/Aguarde)
          if (aluno.status !== 'ativo' && !window.location.pathname.includes("/aguarde")) {
            router.push("/aguarde");
            return;
          }

          // 2. Bloqueio de login duplicado
          // Só bloqueia se o banco JÁ TIVER uma sessão E ela for diferente da local
          if (sessaoLocal && aluno.id_sessao && aluno.id_sessao !== sessaoLocal) {
            console.log("Sessão divergente:", { local: sessaoLocal, banco: aluno.id_sessao });
            alert("⚠️ ACESSO NEGADO: Sua conta foi conectada em outro local.");
            localStorage.clear();
            window.location.href = "/";
            return;
          }

          // Se o banco não tem sessão, mas temos uma local, vamos atualizar o banco em vez de expulsar
          if (sessaoLocal && !aluno.id_sessao) {
            await supabase.from('alunos').update({ id_sessao: sessaoLocal }).eq('id', userId);
          }
        }
      }
    };

    verificarSeguranca();
    const interval = setInterval(verificarSeguranca, 15000); // Heartbeat e Guard a cada 15s

    const handleFocus = () => verificarSeguranca();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

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