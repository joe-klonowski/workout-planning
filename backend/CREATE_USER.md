# Creating a User Account

Since this is a single-user app, user accounts are not created through the web interface. Instead, use the `create_user.py` script to create your account.

## Usage

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python create_user.py
```

The script will prompt you for:
1. A username
2. A password (minimum 6 characters)
3. Password confirmation

## Example

```bash
$ python create_user.py

🔐 Create Workout Planner User
========================================

Enter username: joe
Enter password (min 6 characters): 
Confirm password:

✅ User created successfully!
   Username: joe
   User ID: 1
   Created: 2026-01-05 12:34:56.789012+00:00

You can now login to the workout planner app with these credentials.
```

## Important Notes

- **Single User Only**: This app only supports one user. If you try to create a second user, the script will ask if you want to replace the existing one.
- **Password Requirements**: Passwords must be at least 6 characters long.
- **Security**: The password is hashed using Werkzeug's security functions before being stored in the database.
- **Database**: If you need to completely reset and start over, simply delete the `workout_planner.db` file and create a new user.

## Resetting Your Password

To change your password:

1. Delete the database: `rm backend/workout_planner.db`
2. Run the create user script again: `python create_user.py`
3. Enter your desired username and new password

Alternatively, you could modify the script to add an "update user" feature if needed.
