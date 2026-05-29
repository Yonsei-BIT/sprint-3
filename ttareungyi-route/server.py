import http.server
import urllib.request
import json
import os

SEOUL_KEY = '445966474d796a64363655516c4f79'
BIKE_URL = f'http://openapi.seoul.go.kr:8088/{SEOUL_KEY}/json/bikeList/1/1000/'

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/bikes':
            try:
                with urllib.request.urlopen(BIKE_URL, timeout=10) as res:
                    data = res.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            super().do_GET()

    def log_message(self, format, *args):
        print(f'[{self.address_string()}] {format % args}')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('PORT', 3000))
print(f'서버 시작: http://localhost:{PORT}')
http.server.HTTPServer(('', PORT), Handler).serve_forever()
