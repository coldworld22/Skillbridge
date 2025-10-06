import { render, screen } from '@testing-library/react';
import TicketDetailPanel from '@/components/support/TicketDetailPanel';

jest.mock('next/image', () => (props) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />;
});

jest.mock('@/components/support/StatusBadge', () => ({ status }) => (
  <span data-testid="status-badge">{status}</span>
));

describe('TicketDetailPanel', () => {
  it('shows the ticket customer name when available', () => {
    const ticket = {
      id: 1,
      subject: 'Payment failed',
      status: 'open',
      description: 'My payment did not go through',
      customerName: 'Jamie Lee',
      user_avatar: null,
      messages: [],
    };

    render(<TicketDetailPanel ticket={ticket} />);

    expect(screen.getByText('Jamie Lee')).toBeInTheDocument();
  });
});
