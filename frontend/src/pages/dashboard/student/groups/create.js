import GroupForm from '@/components/groups/GroupForm';
import StudentLayout from '@/components/layouts/StudentLayout';

export default function CreateGroupPage() {
  return (
    <StudentLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a New Group</h1>
        <GroupForm />
      </div>
    </StudentLayout>
  );
}
