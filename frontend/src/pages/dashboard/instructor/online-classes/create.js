import { CreateOnlineClass } from '@/pages/dashboard/admin/online-classes/create';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

CreateOnlineClass.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

export default withAuthProtection(CreateOnlineClass, ['instructor']);
