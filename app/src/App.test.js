import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Workout Planner title', () => {
  render(<App />);
  const titleElement = screen.getByText('Workout Planner');
  expect(titleElement).toBeInTheDocument();
});

test('renders the app description', () => {
  render(<App />);
  const descriptionElement = screen.getByText('Plan your workouts from TrainingPeaks');
  expect(descriptionElement).toBeInTheDocument();
});
