
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NovaSenha() {
  const [senha, setSenha] = useState("");

  const atualizar = async () => {
    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      alert("Erro: " + error.message);
    } else {
      alert("Senha atualizada com sucesso!");
      window.location.href = "/";
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Nova senha</h2>
      <input
        type="password"
        placeholder="Digite nova senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <button onClick={atualizar}>Atualizar</button>
    </div>
  );
}