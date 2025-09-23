import React from 'react';
import { render, screen } from '@testing-library/react';

import LinkText, {
  DEFAULT_LINK_TEXT,
} from '@/components/shared/LinkText';

describe('LinkText', () => {
  it('renders fallback text when no text is provided', () => {
    expect(() => render(<LinkText />)).not.toThrow();
    expect(screen.getByText(DEFAULT_LINK_TEXT)).toBeInTheDocument();
  });

  it('renders provided text when available', () => {
    const message = 'Check this out!';
    render(<LinkText text={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
