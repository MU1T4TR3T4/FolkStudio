const Replicate = require("replicate");
require("dotenv").config({ path: ".env.local" });

async function testToken() {
    const token = process.env.REPLICATE_API_TOKEN;
    console.log("Testando token:", token ? token.substring(0, 5) + "..." : "NÃO ENCONTRADO");

    if (!token) {
        console.error("ERRO: Token não encontrado no .env.local");
        return;
    }

    const replicate = new Replicate({
        auth: token,
    });

    try {
        // Tentar listar modelos ou fazer uma predição simples para validar o token
        // Vamos tentar obter informações de um modelo público
        console.log("Tentando conectar com Replicate...");
        const model = await replicate.models.get("stability-ai", "sdxl");
        console.log("SUCESSO! Token válido.");
        console.log("Acesso ao modelo:", model.owner + "/" + model.name);
    } catch (error) {
        console.error("FALHA: O token parece inválido ou houve erro na conexão.");
        console.error("Erro:", error.message);
    }
}

testToken();
