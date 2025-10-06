import { render, screen } from '@testing-library/react';
import TicketCard from '@/components/support/TicketCard';

jest.mock('next/image', () => (props) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />;
});

jest.mock('@/components/support/StatusBadge', () => ({ status }) => (
  <span data-testid="status-badge">{status}</span>
));

describe('TicketCard', () => {
  it('renders the provided customer name', () => {
    const ticket = {
      id: 1,
      subject: 'Login issue',
      status: 'Open',
      ticket_number: 'SB-1001',
      priority: 'High',
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      customerName: 'Alex Johnson',
    };

    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
  });
});
