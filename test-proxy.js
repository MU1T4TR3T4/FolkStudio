// Teste do proxy de imagem
const testUrl = "https://replicate.delivery/pbxt/test.png"; // URL de teste

async function testProxy() {
    console.log("Testando proxy de imagem...");

    const proxyUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(testUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        console.log("Status:", response.status);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const blob = await response.blob();
            console.log("✅ Proxy funcionando! Tamanho:", blob.size, "bytes");
        } else {
            console.error("❌ Proxy falhou:", await response.text());
        }
    } catch (error) {
        console.error("❌ Erro ao testar proxy:", error);
    }
}

testProxy();
