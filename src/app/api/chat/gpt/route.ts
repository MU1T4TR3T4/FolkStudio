import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        // Inicializar OpenAI client dentro da função
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const body = await req.json();
        const { message, conversationHistory, orderContext } = body;

        if (!message || !message.trim()) {
            return NextResponse.json(
                { status: "error", message: "Mensagem vazia" },
                { status: 400 }
            );
        }

        // Contexto sobre a Folk Studio
        const systemPrompt = `Você é um assistente virtual da Folk Studio, uma empresa especializada em estamparia de camisetas personalizadas.

Informações sobre a empresa:
- Oferecemos estamparia de alta qualidade em diversos tipos de camisetas
- Trabalhamos com diferentes materiais: algodão, poliéster, dry-fit
- Disponibilizamos vários tamanhos: PP, P, M, G, GG, XG
- Cores disponíveis: branco, preto, azul, vermelho, verde, amarelo, cinza, rosa
- Aceitamos pedidos personalizados com design próprio do cliente
- Processo: cliente envia design → geramos mockup → aprovação → produção
- Status de pedidos: Pendente, Em Produção, Concluído

Seu papel:
- Responder dúvidas sobre produtos, processos e pedidos
- Ser cordial, prestativo e profissional
- Fornecer informações claras e precisas
- Se não souber algo específico, orientar o cliente a entrar em contato direto com a equipe
- Manter respostas concisas e objetivas

${orderContext ? `Contexto do pedido atual: ${orderContext}` : ""}`;

        // Preparar mensagens para a API
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
        ];

        // Adicionar histórico de conversa se fornecido
        if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.forEach((msg: any) => {
                messages.push({
                    role: msg.isAdmin ? "assistant" : "user",
                    content: msg.content,
                });
            });
        }

        // Adicionar mensagem atual
        messages.push({ role: "user", content: message });

        // Chamar API da OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

        return NextResponse.json({
            status: "success",
            reply: reply,
        });

    } catch (error: any) {
        console.error("[chat/gpt] Error:", error);

        // Tratamento específico de erros da OpenAI
        if (error?.status === 401) {
            return NextResponse.json(
                { status: "error", message: "Erro de autenticação com OpenAI" },
                { status: 500 }
            );
        }

        if (error?.status === 429) {
            return NextResponse.json(
                { status: "error", message: "Limite de requisições excedido. Tente novamente em alguns instantes." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao processar mensagem" },
            { status: 500 }
        );
    }
}
