// cliente.config.js
module.exports = {
  nomeAutoEscola: "Autoescola Vitória", 
  slogan: "Sua CNH começa aqui",
  logoPath: "/logos/logo-vitoria.png",

  // DEFINIÇÃO DOS TEMAS (O aluno vai alternar entre eles)
  temas: {
    // TEMA DARK (Preto e Dourado) - O seu padrão atual "Elite"
    dark: {
      background: "#0D0E11",
      foreground: "#F0E8D8", // Letras claras
      primary: "#C8A96E",    // Dourado
      cardBg: "rgba(255, 255, 255, 0.03)",
      border: "rgba(200, 169, 110, 0.2)"
    },

    // TEMA LIGHT (Branco e Azul) - Visual "Clean" e Moderno
    light: {
      background: "#FFFFFF",
      foreground: "#1A1B1F", // Letras escuras
      primary: "#0056b3",    // Azul bonito (Royal Blue)
      cardBg: "#f8f9fa",     // Cinza bem clarinho para os cards
      border: "#dee2e6"
    }
  },

  // Qual tema o site carrega primeiro?
  temaPadrao: "dark" 
};