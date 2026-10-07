"""Start the self-contained board demo without dependencies or a fixed port."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import webbrowser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    if not (root / 'dist' / 'index.html').is_file():
        raise SystemExit('Keep this script inside the SafiMaintain folder with its dist folder.')

    class DemoHandler(SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache')
            super().end_headers()

        def log_message(self, fmt, *values):
            if len(values)<2 or str(values[1]) not in ('200', '304'):
                super().log_message(fmt, *values)

    with ThreadingHTTPServer(('127.0.0.1', 0), partial(DemoHandler, directory=str(root / 'dist'))) as server:
        url = f'http://127.0.0.1:{server.server_port}/?device=1&presentation=1'
        print('\nSafiMaintain presentation demo', flush=True)
        print(f'Open: {url}', flush=True)
        print('Sample records are isolated from your normal workspace.', flush=True)
        print('Keep this window open. Press Ctrl+C to stop.\n', flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nDemo stopped.')


if __name__ == '__main__':
    main()
