#!/usr/bin/env python3
"""
Create a user for the workout planner app.

Usage:
    python create_user.py <username> <password>

This script creates a new user in the database. Since this is a single-user app,
you can only create one user. If a user already exists, you'll need to delete
the database (workout_planner.db) first to start fresh.

Example:
    python create_user.py joe mysecurepassword
"""

import sys
import os
from app import create_app
from models import db, User

def create_user(username, password):
    """Create a new user in the database"""
    if len(password) < 6:
        print("❌ Error: Password must be at least 6 characters")
        return False
    
    app = create_app('development')
    
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"❌ Error: User '{username}' already exists")
            print("   This is a single-user app. Delete workout_planner.db to start over.")
            return False
        
        # Check if any user exists (since this is single-user)
        any_user = User.query.first()
        if any_user:
            print(f"❌ Error: A user already exists ('{any_user.username}')")
            print("   This is a single-user app. You can only have one user.")
            print("   Delete workout_planner.db to start over, or update the existing user password.")
            return False
        
        try:
            # Create new user
            user = User(username=username)
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            
            print(f"✅ User '{username}' created successfully!")
            print(f"   You can now login with these credentials.")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating user: {e}")
            return False


def update_user_password(username, new_password):
    """Update an existing user's password"""
    if len(new_password) < 6:
        print("❌ Error: Password must be at least 6 characters")
        return False
    
    app = create_app('development')
    
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"❌ Error: User '{username}' not found")
            return False
        
        try:
            user.set_password(new_password)
            db.session.commit()
            
            print(f"✅ Password for '{username}' updated successfully!")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error updating password: {e}")
            return False


def list_users():
    """List all users in the database"""
    app = create_app('development')
    
    with app.app_context():
        users = User.query.all()
        
        if not users:
            print("No users found in the database.")
            return True
        
        print(f"Found {len(users)} user(s):")
        for user in users:
            last_login = user.last_login.strftime('%Y-%m-%d %H:%M:%S UTC') if user.last_login else 'Never'
            print(f"  - {user.username} (created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}, last login: {last_login})")
        
        return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python create_user.py <username> <password>   - Create a new user")
        print("  python create_user.py --update <username> <password>   - Update user password")
        print("  python create_user.py --list   - List all users")
        print("")
        print("Example:")
        print("  python create_user.py joe mysecurepassword")
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        success = list_users()
        sys.exit(0 if success else 1)
    
    if sys.argv[1] == '--update':
        if len(sys.argv) < 4:
            print("Usage: python create_user.py --update <username> <password>")
            sys.exit(1)
        success = update_user_password(sys.argv[2], sys.argv[3])
        sys.exit(0 if success else 1)
    
    if len(sys.argv) < 3:
        print("Usage: python create_user.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    success = create_user(username, password)
    sys.exit(0 if success else 1)
