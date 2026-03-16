

import Image from 'next/image';

export default function Header({ 
  logo = null, 
  nomeEscola = "Condutor-Pro", 
  slogan = "Portal de Treinamento Teórico" 
}) {
  return (
    <header style={{
      width: "100%",
      padding: "40px 20px",
      textAlign: "center",
      background: "linear-gradient(to bottom, rgba(200, 169, 110, 0.05), transparent)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      marginBottom: "30px"
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Se houver logo, mostra a imagem. Se não, mostra o nome estilizado */}
        {logo ? (
          <div style={{ marginBottom: "15px" }}>
            <Image 
              src={logo} 
              alt={`Logo ${nomeEscola}`}
              width={220} 
              height={70}
              style={{ objectFit: "contain" }}
              priority 
            />
          </div>
        ) : (
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "bold", 
            color: "#C8A96E", 
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 10px 0"
          }}>
            {nomeEscola}
          </h1>
        )}

        {/* Linha decorativa dourada */}
        <div style={{ 
          width: "50px", 
          height: "2px", 
          background: "#C8A96E", 
          margin: "15px auto",
          borderRadius: "2px"
        }}></div>

        {/* Slogan */}
        <p style={{ 
          fontSize: "14px", 
          color: "#F0E8D8", 
          opacity: 0.7, 
          margin: "0",
          fontStyle: "italic"
        }}>
          {slogan}
        </p>
      </div>
    </header>
  );
}