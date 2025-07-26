import { renderHook, act } from '@testing-library/react';
import useBreakoutRoomManager from '@/components/video-call/BreakoutRoomManager';

test('joinRoom with parameter sets currentRoom', () => {
  const { result } = renderHook(() => useBreakoutRoomManager('user', 'host'));
  act(() => {
    result.current.joinRoom('roomA');
  });
  expect(result.current.currentRoom).toBe('roomA');
});
