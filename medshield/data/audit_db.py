import sqlite3
import json
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, List

DB_PATH = Path("medshield_audit.db")

class AuditLogger:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    action TEXT NOT NULL,
                    algorithm TEXT NOT NULL,
                    parameters TEXT,
                    records_processed INTEGER,
                    status TEXT NOT NULL,
                    user_id TEXT,
                    metrics TEXT
                )
            ''')
            conn.commit()

    def log_run(self, action: str, algorithm: str, parameters: Dict[str, Any], 
                records_processed: int, metrics: Dict[str, Any], status: str = "SUCCESS", user_id: str = "system"):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            log_id = str(uuid.uuid4())
            timestamp = datetime.datetime.utcnow().isoformat()
            
            cursor.execute('''
                INSERT INTO audit_logs (id, timestamp, action, algorithm, parameters, records_processed, status, user_id, metrics)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                log_id,
                timestamp,
                action,
                algorithm,
                json.dumps(parameters),
                records_processed,
                status,
                user_id,
                json.dumps(metrics)
            ))
            conn.commit()
            return log_id

    def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM audit_logs 
                ORDER BY timestamp DESC LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "action": row["action"],
                    "algorithm": row["algorithm"],
                    "parameters": json.loads(row["parameters"]) if row["parameters"] else {},
                    "records_processed": row["records_processed"],
                    "status": row["status"],
                    "user_id": row["user_id"],
                    "metrics": json.loads(row["metrics"]) if row["metrics"] else {}
                })
            return result
