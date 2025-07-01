import GroupForm from '@/components/groups/GroupForm';
import AdminLayout from '@/components/layouts/AdminLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

function CreateGroupPage() {
  return (
    <AdminLayout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a New Group</h1>
        <GroupForm />
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(CreateGroupPage, ['admin', 'superadmin']);
