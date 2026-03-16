export function nomeDoNivel(nivel: number) {

  switch (nivel) {
    case 1:
      return "Recruta";
    case 2:
      return "Soldado";
    case 3:
      return "Cabo";
    case 4:
      return "Sargento";
    case 5:
      return "Tenente";
    default:
      return "Lenda do Trânsito";
  }

}