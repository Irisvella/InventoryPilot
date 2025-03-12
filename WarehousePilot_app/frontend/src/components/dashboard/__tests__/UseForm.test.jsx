import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import UseForm from '../UseForm';

describe('Password Generator Functionality', () => {
  test('Generates password between 8-16 characters', async () => {
    const { getByText } = render(<UseForm />);
    const generateButton = getByText('Generate');
    fireEvent.click(generateButton);
    const passwordInput = getByLabelText('Password');
    expect(passwordInput.value.length).toBeGreaterThanOrEqual(8);
    expect(passwordInput.value.length).toBeLessThanOrEqual(16);
  });

  test('Generated password contains mix of characters', async () => {
    const { getByText } = render(<UseForm />);
    const generateButton = getByText('Generate');
    fireEvent.click(generateButton);
    const passwordInput = getByLabelText('Password');
    const password = passwordInput.value;
    expect(password).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{}|;:,.<>?]).+$/);
  });

  test('Password visibility toggle works correctly', async () => {
    const { getByText, getByLabelText } = render(<UseForm />);
    const passwordInput = getByLabelText('Password');
    const toggleButton = getByText('Show');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});