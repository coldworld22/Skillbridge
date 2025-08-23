import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InstructorTutorialsPage from '../../pages/dashboard/instructor/tutorials';
import { fetchInstructorTutorials, submitTutorialForReview } from '../../services/instructor/tutorialService';
import { toast } from 'react-toastify';

jest.mock('../../components/layouts/InstructorLayout', () => {
  function MockInstructorLayout({ children }) {
    return <div>{children}</div>;
  }
  MockInstructorLayout.displayName = 'InstructorLayout';
  return MockInstructorLayout;
});
jest.mock('../../components/tutorials/ProgressChecklistModal', () => {
  function MockProgressChecklistModal() {
    return null;
  }
  MockProgressChecklistModal.displayName = 'ProgressChecklistModal';
  return MockProgressChecklistModal;
});
jest.mock('../../components/common/ConfirmModal', () => {
  function MockConfirmModal() {
    return null;
  }
  MockConfirmModal.displayName = 'ConfirmModal';
  return MockConfirmModal;
});

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../services/instructor/tutorialService');

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('InstructorTutorialsPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows error toast on failed submission', async () => {
    fetchInstructorTutorials.mockResolvedValue([
      {
        id: 1,
        title: 'Test Tutorial',
        status: 'Draft',
        progress: 100,
        updatedAt: new Date().toISOString(),
        language: 'English',
        category_name: 'General',
        level: 'All Levels',
        tags: [],
        views: 0,
        enrollments: 0,
        rating: 0,
        comments: 0,
      },
    ]);
    submitTutorialForReview.mockRejectedValue(new Error('fail'));

    render(<InstructorTutorialsPage />);
    const submitButton = await screen.findByText('dashboard:tutorialsPage.submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitTutorialForReview).toHaveBeenCalledWith(1);
    });

    expect(toast.error).toHaveBeenCalledWith('dashboard:tutorialsPage.submit_for_review_failed');
    expect(toast.success).not.toHaveBeenCalled();
    // Button remains because state wasn't updated
    expect(screen.getByText('dashboard:tutorialsPage.submit')).toBeInTheDocument();
  });
});
