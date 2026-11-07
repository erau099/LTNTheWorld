import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaiverText from '../Waivers/WaiverText';

describe('WaiverText component', () => {
  it('renders liability notice and safety acknowledgments', () => {
    render(<WaiverText />);
    
    expect(
      screen.getByText(/Lighten The World and Foundation 587 are not responsible/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/participation is voluntary/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/You agree to communicate honestly/i)
    ).toBeInTheDocument();
  });
});
