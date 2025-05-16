import { useRouter } from 'next/router';
import groupService from '@/services/groupService';

export default function GroupHeader({ group }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this group?')) {
      await groupService.deleteGroup(group.id);
      router.push('/groups');
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      await groupService.leaveGroup(group.id);
      router.push('/groups');
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <h1 className="text-2xl font-bold">{group.name}</h1>
      <p className="text-gray-600">{group.description}</p>
      <p className="text-sm text-blue-600">
        {group.isPublic ? 'Public Group' : 'Private Group'}
      </p>

      <div className="mt-4 space-x-3">
        {group.creatorId === 1 ? (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete Group
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Leave Group
          </button>
        )}
      </div>
    </div>
  );
}
