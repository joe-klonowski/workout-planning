import logging


def test_logging_no_request_id_does_not_raise():
    """Ensure logging calls from other libraries (e.g., werkzeug) that don't
    set `request_id` do not raise exceptions when formatting."""
    logger = logging.getLogger('werkzeug')
    # This should not raise
    logger.info('Simulated werkzeug log: %s %s', 'OPTIONS /api/auth/verify HTTP/1.1', '200')


def test_safe_formatter_includes_default_request_id():
    """The root handler's formatter should include a fallback `no-request` when
    no request id is present on the LogRecord."""
    root_logger = logging.getLogger()
    assert root_logger.handlers, "Root logger should have at least one handler"
    handler = root_logger.handlers[0]

    # Create a LogRecord without a request_id attribute
    record = logging.LogRecord(name='test', level=logging.INFO, pathname=__file__, lineno=1,
                               msg='a message %s %s', args=('a', '-'), exc_info=None)

    formatted = handler.format(record)
    assert 'no-request' in formatted
