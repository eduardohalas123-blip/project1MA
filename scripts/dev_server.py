"""Servidor local de desenvolvimento do Mural 1MA.

http.server simples, mas forçando charset=utf-8 nas respostas .html (sem
isso os acentos quebram, já que o SimpleHTTPRequestHandler padrão do Python
não declara charset nenhum). Roda na porta 8091, serve a raiz do projeto.

Uso: python scripts/dev_server.py
"""
import http.server
import os

PORTA = 8091
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        if self.path == "/" or self.path.endswith(".html"):
            self.send_header("Content-Type", "text/html; charset=utf-8")
        super().end_headers()


if __name__ == "__main__":
    servidor = http.server.ThreadingHTTPServer(("", PORTA), Handler)
    print(f"Servindo {RAIZ} em http://localhost:{PORTA}")
    servidor.serve_forever()
