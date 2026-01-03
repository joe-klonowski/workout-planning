"""
Script to import CSV workouts into the database
"""
import csv
from datetime import datetime
from app import create_app
from models import db, Workout

def import_workouts_from_csv(csv_file_path):
    """Import workouts from CSV file into database"""
    app = create_app()
    
    with app.app_context():
        imported_count = 0
        skipped_count = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            
            for row in csv_reader:
                # Parse workout day
                originally_planned_day = None
                if row.get('WorkoutDay'):
                    try:
                        originally_planned_day = datetime.strptime(row['WorkoutDay'], '%Y-%m-%d').date()
                    except ValueError:
                        print(f"Skipping row with invalid date: {row.get('WorkoutDay')}")
                        skipped_count += 1
                        continue
                
                if not originally_planned_day:
                    skipped_count += 1
                    continue
                
                # Check if workout already exists (avoid duplicates)
                existing = Workout.query.filter_by(
                    title=row.get('Title', ''),
                    originally_planned_day=originally_planned_day
                ).first()
                
                if existing:
                    print(f"Skipping duplicate: {row.get('Title')} on {originally_planned_day}")
                    skipped_count += 1
                    continue
                
                # Create new workout
                workout = Workout(
                    title=row.get('Title', ''),
                    workout_type=row.get('WorkoutType', 'Other'),
                    workout_description=row.get('WorkoutDescription', ''),
                    planned_duration=float(row['PlannedDuration']) if row.get('PlannedDuration') else None,
                    planned_distance_meters=float(row['PlannedDistanceInMeters']) if row.get('PlannedDistanceInMeters') else None,
                    originally_planned_day=originally_planned_day,
                    coach_comments=row.get('CoachComments', ''),
                    tss=float(row['TSS']) if row.get('TSS') else None,
                    intensity_factor=float(row['IF']) if row.get('IF') else None
                )
                
                db.session.add(workout)
                imported_count += 1
                
                if imported_count % 10 == 0:
                    print(f"Imported {imported_count} workouts...")
        
        db.session.commit()
        
        print(f"\n✅ Import complete!")
        print(f"   Imported: {imported_count} workouts")
        print(f"   Skipped: {skipped_count} workouts")
        
        # Show stats
        total = Workout.query.count()
        print(f"   Total in database: {total} workouts")


if __name__ == '__main__':
    import sys
    
    csv_file = '../inputs/workouts.csv'
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    
    print(f"Importing workouts from: {csv_file}")
    import_workouts_from_csv(csv_file)
