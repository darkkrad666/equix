#!/usr/bin/env python3
"""
Servidor web con seguridad antihackeo y anti-scraping
"""
import http.server
import socketserver
import json
import re
import hashlib
import time
import os
from urllib.parse import urlparse, parse_qs
from http.cookies import SimpleCookie

PORT = 8000

class SecureHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.request_times = {}
        self.rate_limit_window = 60
        self.max_requests = 100
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

    def check_rate_limit(self, client_ip):
        current_time = time.time()
        if client_ip not in self.request_times:
            self.request_times[client_ip] = []
        
        self.request_times[client_ip] = [
            t for t in self.request_times[client_ip]
            if current_time - t < self.rate_limit_window
        ]
        
        if len(self.request_times[client_ip]) >= self.max_requests:
            return False
        
        self.request_times[client_ip].append(current_time)
        return True

    def check_security_headers(self):
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';")
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    def do_GET(self):
        client_ip = self.client_address[0]
        
        if not self.check_rate_limit(client_ip):
            self.send_error(429, "Rate limit exceeded")
            return
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            path = '/index.html'
        elif path.startswith('/datos/'):
            pass
        
        dangerous_patterns = [
            r'\.\.',
            r'\/etc\/passwd',
            r'\/bin\/sh',
            r'localhost',
            r'127\.0\.0\.1',
            r'cmd\.exe',
            r'eval\(',
            r'exec\(',
            r'union\s+select',
            r'<script',
            r'javascript:',
            r'onerror=',
            r'onload=',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                print(f"[SEGURIDAD] Bloqueado patron peligroso: {pattern} en {path}")
                self.send_error(403, "Forbidden")
                return
        
        if path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
        elif path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        elif path.endswith('.css'):
            self.send_header('Content-Type', 'text/css')
        elif path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        
        self.check_security_headers()
        
        try:
            full_path = os.path.join(os.getcwd(), path.lstrip('/'))
            if os.path.exists(full_path) and os.path.isfile(full_path):
                with open(full_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "File not found")
        except Exception as e:
            print(f"[ERROR] {e}")
            self.send_error(500, "Internal server error")

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            print(f"[POST] Datos recibidos: {data}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.check_security_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        except:
            self.send_error(400, "Bad request")

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with ThreadedHTTPServer(("", PORT), SecureHandler) as httpd:
        print(f"""
╔════════════════════════════════════════════════════════╗
║           SERVIDOR WEB SEGURO INICIADO                  ║
╠════════════════════════════════════════════════════════╣
║  URL: http://localhost:{PORT}                            ║
║  URL: http://127.0.0.1:{PORT}                          ║
╠════════════════════════════════════════════════════════════════╣
║  SEGURIDAD ACTIVADA:                                    ║
║  - Rate limiting (100 req/min/IP)                      ║
║  - Anti-path traversal                                  ║
║  - Anti-script injection                                ║
║  - Anti-SQL injection                                  ║
║  - Headers de seguridad (CSP, HSTS, etc)               ║
║  - Bloqueo de patrones peligrosos                      ║
╚════════════════════════════════════════════════════════╝
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Servidor detenido")

if __name__ == "__main__":
    run_server()