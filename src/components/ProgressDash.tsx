
"use client";

interface ProgressProps {
  concluidos: number;
  total: number;
  titulo?: string; // 👈 ADICIONA ISSO
  onClose: () => void;
  
}

export default function ProgressDash({ concluidos, total, titulo }: ProgressProps) {
  const percentual = Math.round((concluidos / total) * 100) || 0;

  return (
    <div style={{
      // Ajustamos o gradiente para ser suave em ambos os temas usando var(--primary) com opacidade
      background: `linear-gradient(90deg, var(--border) 0%, transparent 100%)`,
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "all 0.3s ease"
    }}>
      <div>
        <h3 style={{ 
          fontSize: "12px", 
          color: "var(--primary)", // Dourado no Dark / Azul no Light
          margin: "0 0 5px 0", 
          textTransform: "uppercase", 
          letterSpacing: "1px",
          fontWeight: "bold"
        }}>
          {titulo}</h3>
        <p style={{ fontSize: "24px", margin: 0, color: "var(--foreground)" }}>
          {concluidos} <span style={{ fontSize: "14px", color: "var(--foreground)", opacity: 0.4 }}>de {total} módulos</span>
        </p>
      </div>

      <div style={{ flex: 1, maxWidth: "400px", marginLeft: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
          <span style={{ color: "var(--foreground)", opacity: 0.6 }}>Sua Evolução</span>
          <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{percentual}%</span>
        </div>
        
        {/* Fundo da barra agora usa var(--border) para ser visível no claro e escuro */}
        <div style={{ 
          width: "100%", 
          height: "8px", 
          background: "var(--border)", 
          borderRadius: "10px", 
          overflow: "hidden" 
        }}>
          <div style={{ 
            width: `${percentual}%`, 
            height: "100%", 
            background: "var(--primary)", // Preenchimento dinâmico
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 15px var(--primary)"
          }} />
        </div>
      </div>
    </div>
  );
}