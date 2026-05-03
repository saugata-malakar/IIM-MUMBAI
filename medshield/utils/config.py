"""
Configuration loader and structured logging for MedShield.
"""

import yaml
import logging
from pathlib import Path
from typing import Dict, Any


def load_config(path: str = "config.yaml") -> Dict[str, Any]:
    """Load YAML configuration file."""
    p = Path(path)
    if not p.exists():
        return {}
    with open(p, 'r') as f:
        return yaml.safe_load(f) or {}


def setup_logger(name: str = "medshield", level: str = "INFO") -> logging.Logger:
    """Create a structured logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        fmt = logging.Formatter(
            '[%(asctime)s] %(levelname)s | %(name)s | %(message)s',
            datefmt='%H:%M:%S'
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    return logger
