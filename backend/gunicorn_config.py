"""
Gunicorn configuration file with custom logging to include request IDs
"""
import logging
import os

# Worker settings
workers = 2
timeout = 120
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Custom access log format
# Use {header_name}o to access response headers (not request headers)
# The X-Request-ID header will be set by our Flask after_request hook
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" - request_id={X-Request-ID}o'

# Log to stdout/stderr
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Enable preload for faster startup
preload_app = True
