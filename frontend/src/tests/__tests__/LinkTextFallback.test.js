import { render } from '@testing-library/react';
import LinkText from '@/components/shared/LinkText';

test('LinkText renders safely with undefined text', () => {
  expect(() => render(<LinkText text={undefined} />)).not.toThrow();
});
