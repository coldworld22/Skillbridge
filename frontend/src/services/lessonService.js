import api from '@/services/api/api';

export const getLessonRoomLink = async (lessonId) => {
  const { data } = await api.post(`/users/classes/lessons/${lessonId}/room`);
  return data.url;
};
