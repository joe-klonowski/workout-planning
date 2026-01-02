# Alembic Database Migrations

Generic single-database configuration with Flask-SQLAlchemy.

## Configuration

This Alembic configuration has been customized to work with Flask-SQLAlchemy:
- Database URI is automatically loaded from Flask app configuration
- Metadata is imported from `models.py` via Flask-SQLAlchemy's `db.metadata`
- The `ALEMBIC_RUNNING` environment variable prevents `db.create_all()` during migrations

## Common Commands

### Apply all pending migrations
```bash
alembic upgrade head
```

### Check current migration version
```bash
alembic current
```

### View migration history
```bash
alembic history --verbose
```

### Create a new migration (after modifying models.py)
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Rollback one migration
```bash
alembic downgrade -1
```

### Rollback all migrations
```bash
alembic downgrade base
```

### Apply migrations up to a specific version
```bash
alembic upgrade <revision_id>
```

## Additional Resources

For more information, see:
- [Backend README.md](../README.md) (Database Migrations section)
- [Alembic Documentation](https://alembic.sqlalchemy.org/en/latest/)
