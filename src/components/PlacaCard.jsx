
export default function PlacaCard({ placa }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      padding: "20px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.05)",
      textAlign: "center"
    }}>
      
      <img
        src={placa.img}
        alt={placa.nome}
        onError={(e) => {
          e.target.style.border = "1px solid red";
          e.target.style.padding = "10px";
        }}
        style={{
          width: "100%",
          height: "120px",
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
        color: "#F0E8D8",
        minHeight: "32px"
      }}>
        {placa.nome}
      </strong>

      <span style={{
        fontSize: "11px",
        opacity: 0.6,
        color: "#C8A96E",
        fontWeight: "bold"
      }}>
        {placa.id}
      </span>
    </div>
  );
}