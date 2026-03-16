
export default function DocumentoCard({ doc }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "20px",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      
      <div>
        <span style={{
          fontSize: "12px",
          color: "#C8A96E",
          display: "block",
          marginBottom: "4px"
        }}>
          {doc.categoria}
        </span>

        <strong>{doc.titulo}</strong>
      </div>

      <a
        href={doc.link}
        target="_blank"
        style={{
          color: "#C8A96E",
          textDecoration: "none",
          alignSelf: "center",
          fontWeight: "bold"
        }}
      >
        Acessar Documento →
      </a>
    </div>
  );
}