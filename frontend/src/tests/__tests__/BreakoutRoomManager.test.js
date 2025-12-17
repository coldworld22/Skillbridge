import { renderHook, act } from '@testing-library/react';
import useBreakoutRoomManager from '@/components/video-call/BreakoutRoomManager';

jest.mock('@/services/socketService', () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

test('joinRoom with parameter sets currentRoom', () => {
  const { result } = renderHook(() =>
    useBreakoutRoomManager({
      roomId: 'room1',
      userId: 'user',
      userName: 'User',
      userRole: 'host',
    }),
  );
  act(() => {
    result.current.joinRoom('roomA');
  });
  expect(result.current.currentRoom).toBe('roomA');
});
