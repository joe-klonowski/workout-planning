import {
  parseCSV,
  rowToWorkout,
  parseWorkoutsCSV,
  filterWorkoutsByDateRange,
  groupWorkoutsByDate,
} from './csvParser';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse a simple CSV with headers and one row', () => {
      const csv = '"Name","Age"\n"Alice","30"';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ Name: 'Alice', Age: '30' });
    });

    it('should parse multiple rows', () => {
      const csv = '"Name","Age"\n"Alice","30"\n"Bob","25"';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'Alice', Age: '30' });
      expect(result[1]).toEqual({ Name: 'Bob', Age: '25' });
    });

    it('should handle quoted fields with commas', () => {
      const csv = '"Name","Description"\n"Workout","Run, walk, rest"';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Name: 'Workout',
        Description: 'Run, walk, rest',
      });
    });

    it('should handle escaped quotes within fields', () => {
      const csv = '"Name","Quote"\n"Alice","She said ""Hello"""';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].Quote).toBe('She said "Hello"');
    });

    it('should skip empty lines', () => {
      const csv = '"Name","Age"\n"Alice","30"\n\n"Bob","25"';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
    });

    it('should handle unequal field counts and fill missing values', () => {
      const csv = '"A","B","C"\n"1","2"\n"3","4","5"';
      const result = parseCSV(csv);

      expect(result[0]).toEqual({ A: '1', B: '2', C: '' });
      expect(result[1]).toEqual({ A: '3', B: '4', C: '5' });
    });

    it('should throw error for empty CSV text', () => {
      expect(() => parseCSV('')).toThrow('CSV is empty');
      expect(() => parseCSV(null)).toThrow('CSV text must be a non-empty string');
      expect(() => parseCSV(undefined)).toThrow('CSV text must be a non-empty string');
    });

    it('should throw error if CSV has no headers', () => {
      expect(() => parseCSV(',')).toThrow('CSV has no headers');
    });

    it('should trim whitespace from lines', () => {
      const csv = '"Name","Age"  \n  "Alice","30"  ';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ Name: 'Alice', Age: '30' });
    });
  });

  describe('rowToWorkout', () => {
    const sampleRow = {
      Title: 'Morning Run',
      WorkoutType: 'Run',
      WorkoutDescription: 'Easy 5k run',
      PlannedDuration: '1.5',
      PlannedDistanceInMeters: '5000',
      WorkoutDay: '2026-01-15',
      CoachComments: 'Keep it easy',
      AthleteComments: 'Felt good',
      DistanceInMeters: '5050',
      PowerAverage: '250',
      PowerMax: '300',
      HeartRateAverage: '150',
      HeartRateMax: '160',
      TSS: '100',
      IF: '0.85',
    };

    it('should convert a row to a Workout object', () => {
      const workout = rowToWorkout(sampleRow);

      expect(workout.title).toBe('Morning Run');
      expect(workout.workoutType).toBe('Run');
      expect(workout.description).toBe('Easy 5k run');
      expect(workout.plannedDuration).toBe(1.5);
      expect(workout.plannedDistance).toBe(5000);
    });

    it('should parse the workout date correctly', () => {
      const workout = rowToWorkout(sampleRow);

      expect(workout.workoutDate).toBeInstanceOf(Date);
      expect(workout.workoutDate.getFullYear()).toBe(2026);
      expect(workout.workoutDate.getMonth()).toBe(0); // January
      // Use toISOString to get the UTC date representation
      expect(workout.workoutDate.toISOString().split('T')[0]).toBe('2026-01-15');
    });

    it('should parse numeric fields correctly', () => {
      const workout = rowToWorkout(sampleRow);

      expect(workout.plannedDuration).toBe(1.5);
      expect(workout.plannedDistance).toBe(5000);
      expect(workout.actualDistance).toBe(5050);
      expect(workout.powerAverage).toBe(250);
      expect(workout.tss).toBe(100);
      expect(workout.if).toBe(0.85);
    });

    it('should handle missing numeric fields as 0 or null', () => {
      const minimalRow = {
        Title: 'Workout',
        WorkoutType: 'Run',
      };
      const workout = rowToWorkout(minimalRow);

      expect(workout.plannedDuration).toBe(0);
      expect(workout.plannedDistance).toBe(0);
      expect(workout.actualDistance).toBeNull();
      expect(workout.powerAverage).toBeNull();
    });

    it('should handle missing text fields as empty strings', () => {
      const minimalRow = {
        Title: 'Workout',
        WorkoutType: 'Run',
      };
      const workout = rowToWorkout(minimalRow);

      expect(workout.description).toBe('');
      expect(workout.coachComments).toBe('');
      expect(workout.athleteComments).toBe('');
    });

    it('should return null for invalid workout dates', () => {
      const invalidDateRow = { ...sampleRow, WorkoutDay: 'invalid-date' };
      const workout = rowToWorkout(invalidDateRow);

      expect(workout.workoutDate).toBeNull();
    });

    it('should return null for empty workout date', () => {
      const noDateRow = { ...sampleRow, WorkoutDay: '' };
      const workout = rowToWorkout(noDateRow);

      expect(workout.workoutDate).toBeNull();
    });

    it('should throw error if row is not an object', () => {
      expect(() => rowToWorkout(null)).toThrow('Row must be an object');
      expect(() => rowToWorkout('string')).toThrow('Row must be an object');
    });
  });

  describe('parseWorkoutsCSV', () => {
    it('should parse a complete CSV and return Workout objects', () => {
      const csv =
        '"Title","WorkoutType","WorkoutDescription","PlannedDuration","PlannedDistanceInMeters","WorkoutDay","CoachComments"\n' +
        '"Run 5k","Run","Easy run","0.5","5000","2026-01-15","Keep it easy"';

      const workouts = parseWorkoutsCSV(csv);

      expect(workouts).toHaveLength(1);
      expect(workouts[0].title).toBe('Run 5k');
      expect(workouts[0].workoutType).toBe('Run');
      expect(workouts[0].workoutDate).toBeInstanceOf(Date);
    });

    it('should handle multiple workouts', () => {
      const csv =
        '"Title","WorkoutType","PlannedDuration","WorkoutDay"\n' +
        '"Run","Run","0.5","2026-01-15"\n' +
        '"Swim","Swim","1","2026-01-16"';

      const workouts = parseWorkoutsCSV(csv);

      expect(workouts).toHaveLength(2);
      expect(workouts[0].title).toBe('Run');
      expect(workouts[1].title).toBe('Swim');
    });
  });

  describe('filterWorkoutsByDateRange', () => {
    const workouts = [
      {
        title: 'Workout 1',
        workoutDate: new Date('2026-01-15'),
      },
      {
        title: 'Workout 2',
        workoutDate: new Date('2026-01-20'),
      },
      {
        title: 'Workout 3',
        workoutDate: new Date('2026-01-25'),
      },
      {
        title: 'No Date Workout',
        workoutDate: null,
      },
    ];

    it('should filter workouts within date range', () => {
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-01-20');

      const filtered = filterWorkoutsByDateRange(workouts, startDate, endDate);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].title).toBe('Workout 1');
      expect(filtered[1].title).toBe('Workout 2');
    });

    it('should include boundary dates', () => {
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-01-25');

      const filtered = filterWorkoutsByDateRange(workouts, startDate, endDate);

      expect(filtered).toHaveLength(3);
    });

    it('should exclude workouts without dates', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const filtered = filterWorkoutsByDateRange(workouts, startDate, endDate);

      expect(filtered).toHaveLength(3);
      expect(filtered.every(w => w.workoutDate !== null)).toBe(true);
    });

    it('should throw error if workouts is not an array', () => {
      expect(() =>
        filterWorkoutsByDateRange(null, new Date(), new Date())
      ).toThrow('Workouts must be an array');
    });

    it('should throw error if dates are not Date objects', () => {
      expect(() =>
        filterWorkoutsByDateRange(workouts, '2026-01-15', new Date())
      ).toThrow('Start and end dates must be Date objects');
    });
  });

  describe('groupWorkoutsByDate', () => {
    const workouts = [
      {
        title: 'Morning Run',
        workoutDate: new Date('2026-01-15'),
      },
      {
        title: 'Evening Swim',
        workoutDate: new Date('2026-01-15'),
      },
      {
        title: 'Bike Ride',
        workoutDate: new Date('2026-01-16'),
      },
      {
        title: 'No Date',
        workoutDate: null,
      },
    ];

    it('should group workouts by date', () => {
      const grouped = groupWorkoutsByDate(workouts);

      expect(Object.keys(grouped)).toContain('2026-01-15');
      expect(Object.keys(grouped)).toContain('2026-01-16');
      expect(grouped['2026-01-15']).toHaveLength(2);
      expect(grouped['2026-01-16']).toHaveLength(1);
    });

    it('should exclude workouts without dates', () => {
      const grouped = groupWorkoutsByDate(workouts);

      const allWorkouts = Object.values(grouped).flat();
      expect(allWorkouts).toHaveLength(3);
      expect(allWorkouts.every(w => w.workoutDate !== null)).toBe(true);
    });

    it('should return object with YYYY-MM-DD date keys', () => {
      const grouped = groupWorkoutsByDate(workouts);

      Object.keys(grouped).forEach(key => {
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should return empty object for empty array', () => {
      const grouped = groupWorkoutsByDate([]);

      expect(grouped).toEqual({});
    });

    it('should throw error if workouts is not an array', () => {
      expect(() => groupWorkoutsByDate(null)).toThrow('Workouts must be an array');
      expect(() => groupWorkoutsByDate('not an array')).toThrow('Workouts must be an array');
    });
  });
});
