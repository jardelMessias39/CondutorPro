
"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ValidadorPresenca({ linkAula, alunoId, onClose }: { linkAula: string, alunoId: string, onClose: any }) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [validado, setValidado] = useState(false);

  const capturar = useCallback(async () => {
    const imagem = webcamRef.current?.getScreenshot();
    if (imagem) {
      setImgSrc(imagem);
      setEnviando(true);

      // SALVAR A FOTO NO SUPABASE (Tabela de Presenças)
      const { error } = await supabase.from("presencas").insert([
        { 
          aluno_id: alunoId, 
          foto: imagem, 
          data_hora: new Date().toISOString(),
          tipo: 'entrada_aula' 
        }
      ]);

      if (!error) {
        setValidado(true);
        // Após 2 segundos, abre a aula automaticamente
        setTimeout(() => window.open(linkAula, "_blank"), 2000);
      } else {
        alert("Erro ao validar presença. Tente novamente.");
        setImgSrc(null);
      }
      setEnviando(false);
    }
  }, [webcamRef, linkAula, alunoId]);

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: "#C8A96E", marginBottom: "10px" }}>Validação Biométrica</h2>
        <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "20px" }}>
          Posicione seu rosto de frente para a câmera para liberar o acesso à aula.
        </p>

        {!validado ? (
          <>
            <div style={cameraContainer}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </div>
            
            <button 
              onClick={capturar} 
              disabled={enviando}
              style={btnCapturar}
            >
              {enviando ? "Processando..." : <><Camera size={20} /> TIRAR FOTO AGORA</>}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CheckCircle size={60} color="#5CBF8A" />
            <h3 style={{ color: "#5CBF8A", marginTop: "15px" }}>Presença Confirmada!</h3>
            <p>Redirecionando para a aula ao vivo...</p>
            <button onClick={() => window.open(linkAula, "_blank")} style={btnAula}>
              <Video size={20} /> ENTRAR NA SALA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ESTILOS DE LUXO
const modalStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 };
const cardStyle = { background: "#121318", padding: "30px", borderRadius: "15px", border: "1px solid #C8A96E", maxWidth: "450px", width: "90%", textAlign: "center" as const };
const cameraContainer = { border: "2px solid #222", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", background: "#000" };
const btnCapturar = { background: "#C8A96E", color: "#000", border: "none", padding: "15px 25px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%" };
const btnAula = { background: "#2D8CFF", color: "#fff", border: "none", padding: "15px 25px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%" };