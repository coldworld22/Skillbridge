// SidebarLinks/studentLinks.js
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck2,
  CreditCard,
  FileText,
  GraduationCap,
  User,
  LifeBuoy,
  Settings,
  MessageSquareMore,
  UsersRound,
  FileSignature,
  Brain,
  ClipboardList,
  Users,
  Users2,
  Home,
  Heart,
  Book,
  Star
} from 'lucide-react';

export const studentNavLinks = [
  {
    title: 'overview',
    items: [
      { label: 'dashboard', href: '/dashboard/student', icon: LayoutDashboard },
      { label: 'go_to_website', href: '/website', icon: Home },
    ]
  },
  {
    title: 'learning',
    items: [
      { label: 'my_classes', href: '/dashboard/student/online-classes', icon: BookOpen },
      { label: 'my_tutorials', href: '/dashboard/student/tutorials', icon: Brain },
      { label: 'my_books', href: '/dashboard/student/books', icon: Book },
      { label: 'wishlist', href: '/dashboard/student/wishlist', icon: Heart },
      { label: 'favorite_tutorials', href: '/dashboard/student/tutorials/favorites', icon: Star },
      { label: 'assignments', href: '/dashboard/student/assignments', icon: FileText },
      { label: 'certificates', href: '/dashboard/student/certificates', icon: GraduationCap },
    ]
  },
  {
    title: 'instructors_bookings',
    items: [
      { label: 'instructors', href: '/dashboard/student/instructors', icon: User },
      { label: 'my_bookings', href: '/dashboard/student/bookings', icon: CalendarCheck2 },
      { label: 'messages', href: '/messages', icon: MessageSquareMore },
    ]
  },
  {
    title: 'offers_groups',
    items: [
      { label: 'offers', href: '/dashboard/student/offers', icon: ClipboardList },
      { label: 'explore_groups', href: '/dashboard/student/groups/explore', icon: Users },
      { label: 'my_groups', href: '/dashboard/student/groups/my-groups', icon: Users2 },
    ]
  },
  {
    title: 'payments_social',
    items: [
      { label: 'payments', href: '/dashboard/student/payments', icon: CreditCard },
      { label: 'community', href: '/dashboard/student/community', icon: UsersRound },
      { label: 'my_reviews', href: '/dashboard/student/reviews', icon: FileSignature },
    ]
  },
  {
    title: 'account',
    items: [
      { label: 'profile', href: '/dashboard/student/profile', icon: User },
      { label: 'support', href: '/dashboard/student/support', icon: LifeBuoy },
      { label: 'settings', href: '/dashboard/student/settings', icon: Settings },
    ]
  }
];
