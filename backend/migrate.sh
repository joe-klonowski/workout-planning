#!/bin/bash
# Helper script for common Alembic migration tasks

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Display usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./migrate.sh [command]"
    echo ""
    echo "Commands:"
    echo "  upgrade      - Apply all pending migrations"
    echo "  current      - Show current migration version"
    echo "  history      - Show migration history"
    echo "  create <msg> - Create new migration with message"
    echo "  downgrade    - Rollback one migration"
    echo "  reset        - Rollback all migrations to base"
    echo ""
    exit 0
fi

COMMAND=$1

case "$COMMAND" in
    upgrade)
        echo "Applying all pending migrations..."
        alembic upgrade head
        echo "✅ Database is up to date!"
        ;;
    
    current)
        echo "Current migration version:"
        alembic current
        ;;
    
    history)
        echo "Migration history:"
        alembic history --verbose
        ;;
    
    create)
        if [ -z "$2" ]; then
            echo "Error: Migration message required"
            echo "Usage: ./migrate.sh create \"your migration message\""
            exit 1
        fi
        echo "Creating new migration: $2"
        alembic revision --autogenerate -m "$2"
        echo "✅ Migration created! Review it in alembic/versions/ before applying."
        ;;
    
    downgrade)
        echo "Rolling back one migration..."
        alembic downgrade -1
        echo "✅ Rolled back one migration"
        ;;
    
    reset)
        echo "⚠️  WARNING: This will rollback ALL migrations!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            alembic downgrade base
            echo "✅ All migrations rolled back"
        else
            echo "Cancelled"
        fi
        ;;
    
    *)
        echo "Unknown command: $COMMAND"
        echo "Run './migrate.sh' without arguments to see usage"
        exit 1
        ;;
esac
