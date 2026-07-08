"""
Shared rate limiter instance, kept in its own module to avoid circular
imports — routers need to import `limiter` to use @limiter.limit(...),
but they're also imported BY main.py, so limiter can't live in main.py
itself without creating an import cycle.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)