import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function validarSessao(request: NextRequest): Promise<boolean> {
  const userId = request.headers.get("x-user-id");
  const sessaoId = request.headers.get("x-sessao-id");

  if (!userId || !sessaoId) {
    return false;
  }

  const { data } = await supabase
    .from("alunos")
    .select("id_sessao, status")
    .eq("id", userId)
    .single();

  return data?.id_sessao === sessaoId && data?.status === "ativo";
}

export async function POST(req: NextRequest) {
  try {
    const isValido = await validarSessao(req);
    if (!isValido) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ API key não configurada." }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro na API Groq:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
