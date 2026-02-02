# Request ID Logging Fix

## Problem
Request IDs were not appearing in production logs. The dev environment showed `request_id=no-request` while production showed standard gunicorn access logs without request IDs.

## Root Cause
The production environment uses gunicorn as the WSGI server, which has its own access log format that was overriding the Flask application's custom logging format. The production logs were showing gunicorn's default access log format instead of the custom Flask log format that includes request IDs.

## Solution

### 1. Flask App Changes ([app.py](backend/app.py))
Added an `after_request` hook to include the request ID in response headers:
```python
@app.after_request
def add_request_id_header(response):
    # Add the request ID to the response headers so gunicorn can log it
    if hasattr(g, 'request_id'):
        response.headers['X-Request-ID'] = g.request_id
    return response
```

This allows gunicorn to access the request ID from the response headers.

### 2. Gunicorn Configuration ([backend/gunicorn_config.py](backend/gunicorn_config.py))
Created a new gunicorn configuration file with a custom access log format that includes request IDs:
```python
# Custom access log format
# Use {header_name}o to access response headers
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" - request_id={X-Request-ID}o'
```

The `{X-Request-ID}o` syntax tells gunicorn to extract the X-Request-ID from response headers.

### 3. Production Startup Script ([backend/start-production.sh](backend/start-production.sh))
Updated to use the gunicorn configuration file:
```bash
exec gunicorn --config gunicorn_config.py app:app
```

### 4. Tests ([backend/test_request_id.py](backend/test_request_id.py))
Added comprehensive tests to verify:
- Request IDs appear in response headers
- Custom request IDs from clients are preserved
- Each request gets a unique ID
- Request IDs work for all HTTP methods

All tests pass ✅

## How It Works

1. **Request arrives** → Flask's `before_request` hook generates/extracts request ID → stores in `g.request_id`
2. **Request processed** → Application code can access `g.request_id` for logging
3. **Response sent** → Flask's `after_request` hook adds `X-Request-ID` to response headers
4. **Gunicorn logs** → Gunicorn access log format extracts `X-Request-ID` from response headers

## Expected Production Log Format

After deployment, production logs should look like:
```
100.64.0.2 - - [02/Feb/2026:03:57:54 +0000] "PUT /api/selections/64 HTTP/1.1" 200 177 "https://workout-planning-production.up.railway.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0" - request_id=7f8d0b0f-a94f-4085-a432-475b3da476f7
```

The request ID will appear at the end of each access log line.

## Verification Steps

After deployment to Railway:

1. Make a few requests to the production app
2. Check Railway logs - you should now see `request_id=<uuid>` at the end of each access log line
3. Send a request with a custom `X-Request-ID` header and verify it's logged
4. Check that application error logs (not just access logs) also include the request ID

## Additional Benefits

- **Client-side request tracking**: Clients can send their own request IDs via the `X-Request-ID` header, which will be preserved and returned in the response
- **End-to-end tracing**: The same request ID flows through the entire request lifecycle, making it easy to correlate logs
- **Response headers**: The request ID is visible in browser dev tools (Network tab → Response Headers), making debugging easier
