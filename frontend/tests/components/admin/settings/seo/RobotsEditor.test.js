import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RobotsEditor from '@/components/admin/settings/seo/RobotsEditor';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('@/services/admin/seoConfigService', () => ({
  updateSEOConfig: jest.fn().mockResolvedValue({}),
}));

describe('RobotsEditor', () => {
  it('hydrates textarea content when config.robots updates', async () => {
    const update = jest.fn();
    const initialConfig = { robots: 'User-agent: initial' };
    const updatedConfig = { robots: 'User-agent: updated' };

    const { rerender } = render(<RobotsEditor config={initialConfig} update={update} />);

    expect(screen.getByRole('textbox')).toHaveValue(initialConfig.robots);

    rerender(<RobotsEditor config={updatedConfig} update={update} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue(updatedConfig.robots);
    });
  });

  it('displays saved feedback after successful save', async () => {
    const update = jest.fn();
    const config = { robots: 'User-agent: initial' };

    render(<RobotsEditor config={config} update={update} />);

    fireEvent.click(screen.getByText('save'));

    await waitFor(() => {
      expect(screen.getByText('saved')).toBeInTheDocument();
    });

    expect(update).toHaveBeenCalledWith({ robots: config.robots });
  });
});
