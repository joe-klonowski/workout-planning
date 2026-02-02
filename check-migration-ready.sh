#!/bin/bash
# Pre-deployment checklist script for the unique constraint migration
# This script helps you verify everything is ready before deploying the migration

set -e

echo "🔍 Pre-Deployment Checklist for Unique Constraint Migration"
echo "============================================================"
echo ""

# Check 1: Verify startup script exists and is executable
echo "✓ Check 1: Startup script"
if [ -f "backend/start-production.sh" ]; then
    echo "  ✅ backend/start-production.sh exists"
    if [ -x "backend/start-production.sh" ]; then
        echo "  ✅ Script is executable"
    else
        echo "  ⚠️  Script is not executable (will be fixed by Dockerfile)"
    fi
else
    echo "  ❌ backend/start-production.sh missing!"
    exit 1
fi
echo ""

# Check 2: Verify Dockerfile uses startup script
echo "✓ Check 2: Dockerfile configuration"
if grep -q "start-production.sh" Dockerfile; then
    echo "  ✅ Dockerfile configured to use startup script"
else
    echo "  ❌ Dockerfile not configured correctly!"
    exit 1
fi
echo ""

# Check 3: Verify Procfile uses startup script
echo "✓ Check 3: Procfile configuration"
if grep -q "start-production.sh" Procfile; then
    echo "  ✅ Procfile configured to use startup script"
else
    echo "  ❌ Procfile not configured correctly!"
    exit 1
fi
echo ""

# Check 4: Verify migration exists
echo "✓ Check 4: Migration file"
if [ -f "backend/alembic/versions/ffe812d426e2_add_unique_constraint_on_workout_.py" ]; then
    echo "  ✅ Unique constraint migration exists"
else
    echo "  ❌ Migration file missing!"
    exit 1
fi
echo ""

# Check 5: Test migration locally (optional)
echo "✓ Check 5: Local migration test (optional)"
echo "  To test locally, run:"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    alembic upgrade head"
echo ""

# Check 6: Production database preparation
echo "✓ Check 6: Production database (MANUAL STEPS REQUIRED)"
echo "  Before deploying to Railway, you MUST:"
echo ""
echo "  1. Backup production database (Railway dashboard → Database → Backups)"
echo "  2. Connect to production DB and check for duplicates:"
echo "     SELECT workout_id, COUNT(*) AS cnt"
echo "     FROM workout_selections"
echo "     GROUP BY workout_id"
echo "     HAVING COUNT(*) > 1;"
echo ""
echo "  3. If duplicates found, deduplicate (keep most recent):"
echo "     WITH keep AS ("
echo "       SELECT DISTINCT ON (workout_id) id"
echo "       FROM workout_selections"
echo "       ORDER BY workout_id, updated_at DESC"
echo "     )"
echo "     DELETE FROM workout_selections s"
echo "     WHERE s.id NOT IN (SELECT id FROM keep);"
echo ""
echo "  4. Verify no duplicates remain (query should return 0 rows):"
echo "     SELECT workout_id, COUNT(*) AS cnt"
echo "     FROM workout_selections"
echo "     GROUP BY workout_id"
echo "     HAVING COUNT(*) > 1;"
echo ""

# Summary
echo "============================================================"
echo "📋 DEPLOYMENT CHECKLIST SUMMARY"
echo "============================================================"
echo ""
echo "✅ Automatic migration setup:"
echo "   - Startup script: ready"
echo "   - Dockerfile: configured"
echo "   - Procfile: configured"
echo "   - Migration file: exists"
echo ""
echo "⚠️  BEFORE DEPLOYING:"
echo "   1. [ ] Backup production database"
echo "   2. [ ] Check for duplicate workout_selections"
echo "   3. [ ] Deduplicate if needed"
echo "   4. [ ] Verify zero duplicates"
echo ""
echo "🚀 TO DEPLOY:"
echo "   git add -A"
echo "   git commit -m 'Add automatic migrations with unique constraint'"
echo "   git push origin main"
echo ""
echo "📊 MONITOR DEPLOYMENT:"
echo "   Railway dashboard → Deployments → View logs"
echo "   Look for: '✅ Migrations completed successfully'"
echo ""
echo "For detailed instructions, see RAILWAY_AUTO_MIGRATIONS.md"
