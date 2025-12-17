import OnlineClassList from '@/components/instructors/OnlineClassList';
import withAuthProtection from '@/hooks/withAuthProtection';

const ProtectedOnlineClassList = withAuthProtection(OnlineClassList, ['instructor']);
export default ProtectedOnlineClassList;
