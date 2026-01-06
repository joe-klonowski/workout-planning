#!/usr/bin/env python3
"""
Diagnostic script to check database connection and contents
Run this on Railway to troubleshoot database issues
"""
import os
import sys
from app import create_app
from models import db, User, Workout, WorkoutSelection

def main():
    print("=" * 60)
    print("DATABASE DIAGNOSTIC SCRIPT")
    print("=" * 60)
    
    # Check environment
    print("\n1. Environment Variables:")
    print(f"   FLASK_ENV: {os.environ.get('FLASK_ENV', 'not set')}")
    database_url = os.environ.get('DATABASE_URL', 'not set')
    
    # Mask password in DATABASE_URL for display
    if database_url != 'not set' and '://' in database_url:
        parts = database_url.split('://', 1)
        if '@' in parts[1]:
            creds, rest = parts[1].split('@', 1)
            if ':' in creds:
                user, _ = creds.split(':', 1)
                masked_url = f"{parts[0]}://{user}:***@{rest}"
            else:
                masked_url = database_url
        else:
            masked_url = database_url
    else:
        masked_url = database_url
    
    print(f"   DATABASE_URL: {masked_url}")
    
    # Create app and check database
    print("\n2. Creating Flask app...")
    try:
        config_name = os.environ.get('FLASK_ENV', 'development')
        app = create_app(config_name)
        print(f"   ✓ App created successfully with config: {config_name}")
    except Exception as e:
        print(f"   ✗ Failed to create app: {e}")
        sys.exit(1)
    
    with app.app_context():
        print("\n3. Checking database connection...")
        try:
            # Try to execute a simple query
            result = db.session.execute(db.text('SELECT 1')).scalar()
            print(f"   ✓ Database connection successful (test query returned: {result})")
        except Exception as e:
            print(f"   ✗ Database connection failed: {e}")
            sys.exit(1)
        
        print("\n4. Checking database tables...")
        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"   Found {len(tables)} tables: {', '.join(tables)}")
            
            # Check if required tables exist
            required_tables = ['users', 'workouts', 'workout_selections']
            missing = [t for t in required_tables if t not in tables]
            if missing:
                print(f"   ⚠ Missing required tables: {', '.join(missing)}")
                print(f"   → Run migrations to create tables")
            else:
                print(f"   ✓ All required tables exist")
        except Exception as e:
            print(f"   ✗ Failed to check tables: {e}")
        
        print("\n5. Checking Users table...")
        try:
            users = User.query.all()
            print(f"   Found {len(users)} users:")
            if users:
                for user in users:
                    print(f"     - Username: {user.username}")
                    print(f"       Created: {user.created_at}")
                    print(f"       Last login: {user.last_login}")
            else:
                print("   ⚠ No users found in database")
                print("   → You need to create a user using create_user.py")
        except Exception as e:
            print(f"   ✗ Failed to query users: {e}")
        
        print("\n6. Checking Workouts table...")
        try:
            workouts = Workout.query.all()
            print(f"   Found {len(workouts)} workouts")
            if workouts:
                # Group by type
                from collections import Counter
                types = Counter([w.type for w in workouts])
                for workout_type, count in types.items():
                    print(f"     - {workout_type}: {count} workouts")
        except Exception as e:
            print(f"   ✗ Failed to query workouts: {e}")
        
        print("\n7. Checking WorkoutSelections table...")
        try:
            selections = WorkoutSelection.query.all()
            print(f"   Found {len(selections)} workout selections")
        except Exception as e:
            print(f"   ✗ Failed to query workout selections: {e}")
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    main()
