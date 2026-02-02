"""
Script wrapper to deduplicate workout_selections rows. The heavy lifting lives in
`backend/dedupe_workout_selections.py` so tests can import and call the function
without depending on package layout.

Usage:
    python scripts/dedupe_workout_selections.py [--dry-run] [--backup] [--yes]
"""
import argparse
import shutil
import os
import sys
from datetime import datetime, timezone

from app import create_app
from models import db
# Import from the backend directory's dedupe_workout_selections module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from dedupe_workout_selections import dedupe as backend_dedupe


def backup_sqlite_db_if_file(app, verbose=False):
    uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if uri.startswith('sqlite:///') or uri.startswith('sqlite:////'):
        path = uri.split('sqlite:///')[-1]
        if path.startswith('/'):
            db_path = path
        else:
            db_path = os.path.join(os.getcwd(), path)
        if os.path.exists(db_path):
            ts = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
            backup_path = f"{db_path}.bak-{ts}"
            shutil.copy2(db_path, backup_path)
            if verbose:
                print(f"Backed up SQLite DB {db_path} -> {backup_path}")
            return backup_path
    return None


def main():
    parser = argparse.ArgumentParser(description='Deduplicate workout_selections rows')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--backup', action='store_true', help='Backup SQLite DB file before making changes')
    parser.add_argument('--yes', action='store_true', help='Automatically confirm any actions')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    args = parser.parse_args()

    app = create_app('development')

    if args.backup:
        backup_sqlite_db_if_file(app, verbose=args.verbose)

    if not args.yes and not args.dry_run:
        resp = input('Proceed with dedupe on dev DB? (y/N): ')
        if resp.lower() != 'y':
            print('Aborting.')
            sys.exit(1)

    with app.app_context():
        num_workouts, total_deleted = backend_dedupe(db.session, commit=not args.dry_run, dry_run=args.dry_run, verbose=args.verbose)
        print(f"Result: {num_workouts} workouts had duplicates; {total_deleted} rows deleted")


if __name__ == '__main__':
    main()
