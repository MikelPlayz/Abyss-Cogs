import sqlite3

class DatabaseManager:
    def __init__(self):
        self.conn = sqlite3.connect("abysswalker.db")
        self.cursor = self.conn.cursor()

    def init_db(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS whitelist (
                username TEXT PRIMARY KEY
            );
        """)
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                bot_id TEXT,
                action TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        self.conn.commit()

    def check_whitelist(self, username):
        self.cursor.execute("SELECT username FROM whitelist WHERE username = ?", (username,))
        return self.cursor.fetchone() is not None

    def log_command(self, username, bot_id, action):
        self.cursor.execute("INSERT INTO logs (username, bot_id, action) VALUES (?, ?, ?)",
                            (username, bot_id, action))
        self.conn.commit()