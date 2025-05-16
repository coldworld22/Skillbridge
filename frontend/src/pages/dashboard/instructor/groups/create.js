import GroupForm from '@/components/groups/GroupForm';
import InstructorLayout from '@/components/layouts/InstructorLayout';

export default function CreateGroupPage() {
  return (
    <InstructorLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a New Group</h1>
        <GroupForm />
      </div>
    </InstructorLayout>
  );
}
