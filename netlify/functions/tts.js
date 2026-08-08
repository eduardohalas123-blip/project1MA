// Netlify Function — proxy pro mecanismo REAL de voz do Google Tradutor (o
// mesmo RPC interno que a lib Python `gTTS` usa, portado daqui:
// C:\...\Python312\Lib\site-packages\gtts\tts.py, classe gTTS).
//
// Por que isso precisa de um servidor: a resposta desse endpoint não tem
// header Access-Control-Allow-Origin, então o navegador bloqueia por CORS
// qualquer tentativa de ler os bytes direto via fetch/XHR de um site
// diferente. Servidor-pra-servidor não tem CORS (é regra só do navegador),
// então essa function faz a chamada por trás e devolve o MP3 pronto pro
// navegador, com CORS liberado na resposta dela mesma.
//
// Uso: /.netlify/functions/tts?texto=...&idioma=en[&devagar=1]

const GOOGLE_TTS_URL = "https://translate.google.com/_/TranslateWebserverUi/data/batchexecute";
const GOOGLE_TTS_MAX_CHARS = 100; // mesmo limite que o gTTS usa por request
const GOOGLE_TTS_HEADERS = {
  Referer: "http://translate.google.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36",
  "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
};

function dividirEmPedacos(texto, tamanhoMax) {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const partes = [];
  let atual = "";
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length > tamanhoMax) {
      if (atual) partes.push(atual);
      atual = palavra.length > tamanhoMax ? palavra.slice(0, tamanhoMax) : palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) partes.push(atual);
  return partes.length ? partes : [texto.slice(0, tamanhoMax)];
}

function montarCorpoRpc(texto, idioma, devagar) {
  // mesma estrutura que gTTS._package_rpc(): [texto, idioma, velocidade, "null"]
  // velocidade: true = devagar (Speed.SLOW), null = normal (Speed.NORMAL)
  const parametro = JSON.stringify([texto, idioma, devagar ? true : null, "null"]);
  const rpc = JSON.stringify([[["jQ1olc", parametro, null, "generic"]]]);
  return `f.req=${encodeURIComponent(rpc)}&`;
}

async function gerarPedacoDeAudio(texto, idioma, devagar) {
  const resposta = await fetch(GOOGLE_TTS_URL, {
    method: "POST",
    headers: GOOGLE_TTS_HEADERS,
    body: montarCorpoRpc(texto, idioma, devagar),
  });

  if (!resposta.ok) {
    throw new Error(`Google respondeu ${resposta.status}`);
  }

  const corpo = await resposta.text();
  const linha = corpo.split("\n").find((l) => l.includes("jQ1olc"));
  if (!linha) throw new Error("Resposta do Google sem áudio (idioma inválido?)");

  // mesma regex que o gTTS usa pra extrair o base64 de dentro do RPC
  const match = linha.match(/jQ1olc","\[\\"(.*)\\"]/);
  if (!match) throw new Error("Não consegui extrair o áudio da resposta");

  return Buffer.from(match[1], "base64");
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const texto = (params.texto || "").trim();
  const idioma = params.idioma || "en";
  const devagar = params.devagar === "1";

  if (!texto) {
    return { statusCode: 400, body: "Faltou o parâmetro texto" };
  }

  try {
    const pedacos = dividirEmPedacos(texto, GOOGLE_TTS_MAX_CHARS);
    const buffers = [];
    for (const pedaco of pedacos) {
      buffers.push(await gerarPedacoDeAudio(pedaco, idioma, devagar));
    }
    const audio = Buffer.concat(buffers);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
      body: audio.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (erro) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `Erro ao gerar áudio: ${erro.message}`,
    };
  }
};
