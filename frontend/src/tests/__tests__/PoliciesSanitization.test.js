import { render } from '@testing-library/react';
import DOMPurify from 'isomorphic-dompurify';

const Preview = ({ content }) => (
  <div data-testid="preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
);

test('sanitizes script tags and event handlers before rendering', () => {
  const dirty = '<p>Safe</p><script>alert("x")</script><img src=x onerror="alert(1)" />';
  const { getByTestId } = render(<Preview content={dirty} />);
  const html = getByTestId('preview').innerHTML;
  expect(html).toContain('<p>Safe</p>');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('onerror');
});
