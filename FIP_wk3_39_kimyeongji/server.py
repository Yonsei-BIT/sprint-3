import http.server
import urllib.request
import json
import os

SEOUL_KEY  = '445966474d796a64363655516c4f79'
BASE_URL   = f'http://openapi.seoul.go.kr:8088/{SEOUL_KEY}/json/bikeList'
TMAP_KEY   = 'Lvoc5ZULzy1GKp3UBZcev30QGw0ttZGC8ouF2Sd9'
TMAP_TRANSIT = 'https://apis.openapi.sk.com/transit/routes'

def fetch_all_stations():
    """1~3000 범위를 1000개씩 나눠 가져와 합침"""
    all_rows = []
    for start in range(1, 3001, 1000):
        end = start + 999
        url = f'{BASE_URL}/{start}/{end}/'
        with urllib.request.urlopen(url, timeout=15) as res:
            d = json.loads(res.read())
        rows = d.get('rentBikeStatus', {}).get('row', [])
        all_rows.extend(rows)
    return all_rows

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, appKey')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/bikes':
            try:
                rows = fetch_all_stations()
                result = json.dumps({'rentBikeStatus': {'row': rows}}, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(result.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/transit':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body   = self.rfile.read(length)
                req = urllib.request.Request(
                    TMAP_TRANSIT,
                    data=body,
                    headers={
                        'Content-Type': 'application/json',
                        'appKey': TMAP_KEY
                    },
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=15) as res:
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
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f'[{self.address_string()}] {format % args}')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('PORT', 3000))
print(f'서버 시작: http://localhost:{PORT}')
http.server.HTTPServer(('', PORT), Handler).serve_forever()
