from flask import Flask, jsonify, render_template_string, request, session, redirect, url_for
import os
import subprocess
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-secret-key-now")

SCRIPT_DIR = "/home/ubuntu"
SCRIPT_PATH = "/home/ubuntu/zenith-all.sh"
RUN_AS_USER = "ubuntu"
ALLOWED_ACTIONS = {"start", "stop", "restart", "status"}
AUTH_USERNAME = "Admin"
AUTH_PASSWORD = os.environ.get("ADMIN_PASSWORD", "ChangeMeNow123!")

LOGIN_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Abyss Admin Login</title>
  <style>
    :root {
      --bg-1: #0b1020;
      --bg-2: #121a31;
      --card: rgba(18, 26, 49, 0.82);
      --border: rgba(255, 255, 255, 0.10);
      --text: #ecf3ff;
      --muted: #a7b7d6;
      --accent-1: #7c3aed;
      --accent-2: #06b6d4;
      --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      --radius: 24px;
      --danger: #ef4444;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 28%),
        radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.16), transparent 32%),
        linear-gradient(135deg, var(--bg-1), var(--bg-2));
      padding: 24px;
    }

    .card {
      width: min(100%, 460px);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 28px;
      backdrop-filter: blur(14px);
    }

    h1 {
      margin: 0 0 10px;
      font-size: 2rem;
    }

    p {
      margin: 0 0 20px;
      color: var(--muted);
      line-height: 1.6;
    }

    label {
      display: block;
      margin: 14px 0 8px;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(7,11,23,0.7);
      color: white;
      font-size: 1rem;
      outline: none;
    }

    input:focus {
      border-color: rgba(6, 182, 212, 0.65);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.16);
    }

    button {
      width: 100%;
      margin-top: 20px;
      padding: 15px 18px;
      border: 0;
      border-radius: 16px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1rem;
      color: white;
      background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
    }

    .error {
      margin-top: 14px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.32);
      color: #fecaca;
    }

    .hint {
      margin-top: 14px;
      font-size: 0.92rem;
      color: #8ea0c7;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>Abyss Admin Login</h1>
    <p>Sign in to access the admin controls.</p>
    <form method="post" action="/login">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required>

      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>

      <button type="submit">Sign In</button>
    </form>
    {% if error %}
      <div class="error">{{ error }}</div>
    {% endif %}
    
  </main>
</body>
</html>
"""

HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Abyss Admin Panel</title>
  <style>
    :root {
      --bg-1: #0b1020;
      --bg-2: #121a31;
      --card: rgba(18, 26, 49, 0.82);
      --border: rgba(255, 255, 255, 0.10);
      --text: #ecf3ff;
      --muted: #a7b7d6;
      --accent-1: #7c3aed;
      --accent-2: #06b6d4;
      --accent-3: #ef4444;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      --radius: 24px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 28%),
        radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.16), transparent 32%),
        linear-gradient(135deg, var(--bg-1), var(--bg-2));
      padding: 32px;
    }

    .wrap {
      max-width: 1080px;
      margin: 0 auto;
    }

    .hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      padding: 28px;
      overflow: hidden;
      position: relative;
    }

    .hero::before {
      content: "";
      position: absolute;
      inset: -1px;
      background: linear-gradient(135deg, rgba(124,58,237,0.28), transparent 35%, rgba(6,182,212,0.18));
      z-index: 0;
      pointer-events: none;
    }

    .hero > * { position: relative; z-index: 1; }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .sub {
      margin: 0;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.6;
      max-width: 760px;
    }

    .section {
      margin-top: 28px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
      backdrop-filter: blur(12px);
    }

    .section h2 {
      margin: 0 0 8px;
      font-size: 1.35rem;
    }

    .section p {
      margin: 0 0 18px;
      color: var(--muted);
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .btn, .action-btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.08);
      color: white;
      text-decoration: none;
      border-radius: 18px;
      padding: 18px 18px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      min-height: 84px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
    }

    .btn:hover, .action-btn:hover {
      transform: translateY(-2px) scale(1.01);
      border-color: rgba(255,255,255,0.16);
    }

    .logs {
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
    }

    .proxy {
      background: linear-gradient(135deg, #7c3aed, #ec4899);
    }

    .docs {
      background: linear-gradient(135deg, #0891b2, #22c55e);
    }

    .start {
      background: linear-gradient(135deg, rgba(34,197,94,0.95), rgba(16,185,129,0.9));
    }

    .stop {
      background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(190,24,93,0.9));
    }

    .restart {
      background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(249,115,22,0.9));
    }

    .status-card {
      margin-top: 20px;
      background: rgba(5, 10, 24, 0.5);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 18px;
    }

    .status-line {
      margin: 0 0 12px;
      font-size: 0.98rem;
      color: #dbe7ff;
    }

    .status-line span {
      color: var(--muted);
    }

    pre {
      margin: 0;
      padding: 16px;
      border-radius: 16px;
      overflow: auto;
      background: #070b17;
      border: 1px solid rgba(255,255,255,0.08);
      color: #d9e7ff;
      font-size: 0.92rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 100px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      color: var(--muted);
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 0.92rem;
    }

    .footer-note {
      margin-top: 16px;
      color: #8ea0c7;
      font-size: 0.92rem;
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }

      body {
        padding: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Abyss Admin Panel</h1>
      <p class="sub">
        Quickly launch all Abyss related sites with one click, or control Abyss Mineraft Bots.
      </p>
      <div class="pill">I hope you like this. If not, just don't tell me. I don't wanna know.</div>
      <div class="pill">Signed in as <strong style="color:#fff; margin-left:4px;">Admin</strong> · <a href="/logout" style="color:#fff; text-decoration:none; margin-left:8px;">Logout</a></div>
    </section>

    <section class="section">
      <h2>Site Shortcuts</h2>
      <p>Jump straight into the main service pages.</p>
      <div class="grid">
        <a class="btn logs" href="https://logs.abyssgaming.site" target="_blank" rel="noopener noreferrer">Logs</a>
        <a class="btn proxy" href="https://proxy.abyssgaming.site" target="_blank" rel="noopener noreferrer">Proxy</a>
        <a class="btn docs" href="https://docs.abyssgaming.site" target="_blank" rel="noopener noreferrer">Documentation</a>
      </div>
    </section>

    <section class="section">
      <h2>Abyss Bot Controls</h2>
      <p>These buttons provide basic controls for the Abyss Bots. For more indepth controls, you know where to go.</p>
      <div class="grid">
        <button class="action-btn start" onclick="runAction('start')">Start</button>
        <button class="action-btn stop" onclick="runAction('stop')">Stop</button>
        <button class="action-btn restart" onclick="runAction('restart')">Restart</button>
      </div>
      <div style="margin-top:16px; display:flex; justify-content:center;">
        <button class="action-btn" style="max-width:260px; width:100%; background: linear-gradient(135deg, #334155, #475569);" onclick="runAction('status')">Debug (Useful for Mikel)</button>
      </div>

      <div class="status-card">
        <p class="status-line"><strong>Last Result:</strong> <span id="summary">No action run yet.</span></p>
        <pre id="output">Waiting for command output...</pre>
      </div>

      <div class="footer-note">
        Made by MikelPlayz, and Makattack1980. For complaints, contact complaints@mikelplayz.site I'll totally answer.                                      Running Walker  v0.017
      </div>
    </section>
  </div>

  <script>
    async function runAction(action) {
      const summary = document.getElementById('summary');
      const output = document.getElementById('output');

      summary.textContent = `Running ${action}...`;
      output.textContent = 'Please wait...';

      try {
        const response = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });

                const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { error: text || 'Server returned a non-JSON response.' };
        }

        if (!response.ok) {
          summary.textContent = `${action} failed`;
          output.textContent = data.error || data.output || 'Unknown error';
          return;
        }

        summary.textContent = `${data.action} completed with exit code ${data.returncode} at ${data.timestamp}`;
        if (data.command) {
          output.textContent = `$ ${data.command}

${data.output || '(No output returned)'}`;
        } else {
          output.textContent = data.output || '(No output returned)';
        }
      } catch (error) {
        summary.textContent = `${action} failed`;
        output.textContent = error.message;
      }
    }
  </script>
</body>
</html>
"""


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get("authenticated"):
            if request.path.startswith("/api/"):
                return jsonify({"ok": False, "error": "Unauthorized"}), 401
            return redirect(url_for("login"))
        return view_func(*args, **kwargs)
    return wrapped


def run_script_action(action: str):
    if action not in ALLOWED_ACTIONS:
        return {
            "ok": False,
            "error": f"Invalid action: {action}",
        }, 400

    if not os.path.isfile(SCRIPT_PATH):
        return {
            "ok": False,
            "error": f"Script not found: {SCRIPT_PATH}",
        }, 404

    log_path = "/tmp/zenith-all-web.log"

    if action == "status":
        try:
            result = subprocess.run(
                ["/bin/bash", "-lc", f"tail -n 120 {log_path}"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            output = ((result.stdout or "").strip() or (result.stderr or "").strip() or "No script log output yet.")
            return {
                "ok": True,
                "action": action,
                "returncode": result.returncode,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "command": f"tail -n 120 {log_path}",
                "output": output,
            }, 200
        except Exception as exc:
            return {
                "ok": False,
                "error": str(exc),
            }, 500

    command = (
        f"cd {SCRIPT_DIR} && "
        f"sudo -u {RUN_AS_USER} /bin/bash {SCRIPT_PATH} {action} "
        f"> {log_path} 2>&1"
    )

    try:
        result = subprocess.run(
            ["/bin/bash", "-lc", command],
            cwd=SCRIPT_DIR,
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
            env={
                **os.environ,
                "HOME": f"/home/{RUN_AS_USER}",
                "USER": os.environ.get("USER", "adminpanel"),
            },
        )

        stdout = (result.stdout or "").strip()
        stderr = (result.stderr or "").strip()
        log_tail = ""
        try:
            tail_result = subprocess.run(
                ["/bin/bash", "-lc", f"tail -n 120 {log_path}"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            log_tail = (tail_result.stdout or "").strip()
        except Exception:
            log_tail = ""

        combined_output = "\n".join(part for part in [stdout, stderr, log_tail] if part).strip()

        return {
            "ok": result.returncode == 0,
            "action": action,
            "returncode": result.returncode,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "command": command,
            "output": combined_output or "Command finished with no output.",
        }, 200 if result.returncode == 0 else 500
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "error": f"{action} command timed out.",
            "command": command,
        }, 504
    except Exception as exc:
        return {
            "ok": False,
            "error": str(exc),
            "command": command,
        }, 500


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = str(request.form.get("username", "")).strip()
        password = str(request.form.get("password", ""))

        if username == AUTH_USERNAME and password == AUTH_PASSWORD:
            session["authenticated"] = True
            return redirect(url_for("index"))

        error = "Invalid username or password."

    return render_template_string(LOGIN_HTML, error=error)


@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.get("/")
@login_required
def index():
    return render_template_string(HTML)


@app.post("/api/control")
@login_required
def control():
    data = request.get_json(silent=True) or {}
    action = str(data.get("action", "")).strip().lower()
    payload, status = run_script_action(action)
    return jsonify(payload), status


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "3030"))
    app.run(host="0.0.0.0", port=port, debug=False)
