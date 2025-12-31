import {
  WORKOUT_TYPES,
  getWorkoutTypeStyle,
  getWorkoutIcon,
  getWorkoutColor,
} from './workoutTypes';

describe('Workout Types Utility', () => {
  describe('WORKOUT_TYPES constants', () => {
    it('should have all expected workout type constants', () => {
      expect(WORKOUT_TYPES.SWIM).toBe('Swim');
      expect(WORKOUT_TYPES.RUN).toBe('Run');
      expect(WORKOUT_TYPES.BIKE).toBe('Bike');
      expect(WORKOUT_TYPES.STRENGTH).toBe('Strength');
      expect(WORKOUT_TYPES.DAY_OFF).toBe('Day Off');
      expect(WORKOUT_TYPES.OTHER).toBe('Other');
    });
  });

  describe('getWorkoutTypeStyle', () => {
    it('should return style for Swim workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.SWIM);
      expect(style).toEqual({
        color: '#0066CC',
        backgroundColor: '#E3F2FD',
        icon: '🏊',
        label: 'Swim',
      });
    });

    it('should return style for Run workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.RUN);
      expect(style).toEqual({
        color: '#D32F2F',
        backgroundColor: '#FFEBEE',
        icon: '🏃',
        label: 'Run',
      });
    });

    it('should return style for Bike workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.BIKE);
      expect(style).toEqual({
        color: '#F57C00',
        backgroundColor: '#FFF3E0',
        icon: '🚴',
        label: 'Bike',
      });
    });

    it('should return style for Strength workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.STRENGTH);
      expect(style).toEqual({
        color: '#6D28D9',
        backgroundColor: '#F3E5F5',
        icon: '💪',
        label: 'Strength',
      });
    });

    it('should return style for Day Off workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.DAY_OFF);
      expect(style).toEqual({
        color: '#558B2F',
        backgroundColor: '#F1F8E9',
        icon: '😴',
        label: 'Rest',
      });
    });

    it('should return style for Other workout', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.OTHER);
      expect(style).toEqual({
        color: '#555555',
        backgroundColor: '#EEEEEE',
        icon: '📋',
        label: 'Other',
      });
    });

    it('should return default style for unknown workout type', () => {
      const style = getWorkoutTypeStyle('UnknownType');
      expect(style).toEqual({
        color: '#555555',
        backgroundColor: '#EEEEEE',
        icon: '📋',
        label: 'Other',
      });
    });

    it('should have color and backgroundColor properties', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.RUN);
      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('backgroundColor');
      expect(typeof style.color).toBe('string');
      expect(typeof style.backgroundColor).toBe('string');
    });

    it('should have icon and label properties', () => {
      const style = getWorkoutTypeStyle(WORKOUT_TYPES.SWIM);
      expect(style).toHaveProperty('icon');
      expect(style).toHaveProperty('label');
      expect(typeof style.icon).toBe('string');
      expect(typeof style.label).toBe('string');
    });
  });

  describe('getWorkoutIcon', () => {
    it('should return correct icon for Swim', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.SWIM)).toBe('🏊');
    });

    it('should return correct icon for Run', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.RUN)).toBe('🏃');
    });

    it('should return correct icon for Bike', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.BIKE)).toBe('🚴');
    });

    it('should return correct icon for Strength', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.STRENGTH)).toBe('💪');
    });

    it('should return correct icon for Day Off', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.DAY_OFF)).toBe('😴');
    });

    it('should return correct icon for Other', () => {
      expect(getWorkoutIcon(WORKOUT_TYPES.OTHER)).toBe('📋');
    });

    it('should return default icon for unknown type', () => {
      expect(getWorkoutIcon('Unknown')).toBe('📋');
    });
  });

  describe('getWorkoutColor', () => {
    it('should return correct color for Swim', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.SWIM)).toBe('#0066CC');
    });

    it('should return correct color for Run', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.RUN)).toBe('#D32F2F');
    });

    it('should return correct color for Bike', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.BIKE)).toBe('#F57C00');
    });

    it('should return correct color for Strength', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.STRENGTH)).toBe('#6D28D9');
    });

    it('should return correct color for Day Off', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.DAY_OFF)).toBe('#558B2F');
    });

    it('should return correct color for Other', () => {
      expect(getWorkoutColor(WORKOUT_TYPES.OTHER)).toBe('#555555');
    });

    it('should return default color for unknown type', () => {
      expect(getWorkoutColor('Unknown')).toBe('#555555');
    });
  });

  describe('Style consistency', () => {
    it('should have consistent styling across all known types', () => {
      const types = Object.values(WORKOUT_TYPES);
      types.forEach((type) => {
        const style = getWorkoutTypeStyle(type);
        expect(style).toHaveProperty('color');
        expect(style).toHaveProperty('backgroundColor');
        expect(style).toHaveProperty('icon');
        expect(style).toHaveProperty('label');
        expect(style.color).toMatch(/^#[0-9A-F]{6}$/i);
        expect(style.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
        expect(style.icon).toBeTruthy();
        expect(style.label).toBeTruthy();
      });
    });
  });
});
