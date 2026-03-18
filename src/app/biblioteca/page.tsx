"use client";

import React, { useState, useMemo } from "react";
import CourseHeader from "@/components/CourseHeader";
import { Search, BookOpen, FileText, Info } from "lucide-react";
import placasData from "@/data/sinalizacao.json";
import Image from "next/image";
import Header from "@/components/Header";
import RankingWidget from "@/components/Ranking/RankingWidget";
export default function Biblioteca() {

  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");


  const MANUAIS_OFICIAIS = [
  {
    titulo: "Código de Trânsito Brasileiro (CTB)",
    orgao: "Planalto / Governo Federal",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9503.htm",
    cor: "#0047AB",
    icon: "⚖️"
  },
  {
    titulo: "Manual de Primeiros Socorros",
    orgao: "Diretriz Oficial",
    // Link alternativo mais estável do Ministério da Saúde/Infraestrutura
    link: "/manuais/Primeiros_socorros.pdf",
    cor: "#E05C5C",
    icon: "🚑"
  },
  {
    titulo: "Direção Defensiva",
    orgao: "SENATRAN",
    link: "/manuais/direcaodefensiva.pdf",
    cor: "#5C8FE0",
    icon: "🛡️"
  },
  {
    titulo: "Manual de Sinalização",
    orgao: "CONTRAN",
    link: "/manuais/Regulamentacao_F.pdf",
    cor: "#008751",
    icon: "🛑"
  },
  {
    titulo: "Sinalização Horizontal",
    orgao: "CONTRAN",
    link: "/manuais/Sinalizacao_Horizontal.pdf", // Atenção: se o arquivo tiver S maiúsculo, aqui tem que ter também!
    cor: "#008751",
    icon: "🛑"
  },
  {
    titulo: "Mecânica Básica",
    orgao: "Acesso Offline Garantido",
    link: "/manuais/mecanica.pdf",
    cor: "#C8A96E",
    icon: "🔧"
  },
  {
    titulo: "Sinalização Cicloviária",
    orgao: "CONTRAN",
    link: "/manuais/Sinalizacao_Cicloviaria.pdf",
    cor: "#10B981",
    icon: "🚲"
  }

];
  

  const placas = placasData;

// FILTRO DE DOCUMENTOS ATUALIZADO
  const documentosFiltrados = useMemo(() => {
    // Trocamos 'documentos' por 'MANUAIS_OFICIAIS'
    return MANUAIS_OFICIAIS.filter(doc =>
      doc.titulo.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca]);

  // FILTRO DE PLACAS

  const placasFiltradas = useMemo(() => {
    return placas.filter(p =>
      (categoriaAtiva === "Todas" || p.cat === categoriaAtiva) &&
      p.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [busca, categoriaAtiva]);

  const categorias = ["Todas", "Regulamentação", "Advertência", "Indicação"];

  return (

    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>

      <CourseHeader activePage="Biblioteca" />
      <RankingWidget />


      <main style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
        <Header
          nomeEscola="Autoescola Liderança"
          slogan="Sua CNH começa aqui"
        />
        {/* EXPLICAÇÃO */}
        <div style={{
          background: "rgba(200,169,110,0.1)",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #C8A96E",
          marginBottom: "40px",
          display: "flex",
          gap: "15px"
        }}>
          <Info color="#C8A96E" size={40} />

          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <strong>Como funciona a Biblioteca:</strong>
            Aqui você encontra todo o material de apoio para sua formação.
            Use a barra de busca para filtrar placas por nome ou documentos por título.
          </p>
        </div>

        {/* BUSCA */}
        <div style={{ position: "relative", marginBottom: "40px" }}>

          <input
            type="text"
            placeholder="O que você está procurando?"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 50px",
              borderRadius: "10px",
              background: "#1A1B1F",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white"
            }}
          />

          <Search size={22} style={{
            position: "absolute",
            left: "15px",
            top: "18px",
            color: "#C8A96E"
          }} />

        </div>

        {/* PLACAS */}
        <section style={{ marginBottom: "60px" }}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}>

            <h2 style={{ display: "flex", gap: "10px" }}>
              <BookOpen color="#C8A96E" />
              Catálogo de Sinalização
            </h2>


            <div className="container-filtros" style={{ display: "flex", gap: "8px" }}>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid #C8A96E",
                    background: categoriaAtiva === cat ? "#C8A96E" : "transparent",
                    color: categoriaAtiva === cat ? "#000" : "#C8A96E",
                    cursor: "pointer"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>


          <div className="grid-placas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}>
            {placasFiltradas.map(placa => (
              <div key={placa.id} style={{
                background: "rgba(255,255,255,0.03)",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center"
              }}>

                <Image
                  src={placa.img}
                  alt={placa.nome}
                  width={120}
                  height={120}
                  style={{
                    objectFit: "contain",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    background: "#fff"
                  }}
                />

                <strong style={{
                  display: "block",
                  fontSize: "13px",
                  marginBottom: "5px",
                  color: "var(--foreground)",
                  minHeight: "32px"
                }}>
                  {placa.nome}
                </strong>

                <span style={{
                  fontSize: "11px",
                  opacity: 0.6,
                  color: "var(--primary)",
                  fontWeight: "bold"
                }}>
                  {placa.id}
                </span>

              </div>


            ))}

          </div>

        </section>

        <div style={{ padding: '20px' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Biblioteca de Manuais Oficiais</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '15px'
          }}>
            {MANUAIS_OFICIAIS.map((manual, index) => (
              <a
                key={index}
                href={manual.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${manual.cor}`,
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  fontSize: '30px',
                  background: manual.cor,
                  padding: '10px',
                  borderRadius: '10px'
                }}>
                  {manual.icon}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#FFF', fontSize: '14px' }}>{manual.titulo}</h4>
                  <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{manual.orgao}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}