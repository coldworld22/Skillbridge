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
  Heart
} from 'lucide-react';

export const studentNavLinks = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
      { label: 'Go to Website', href: '/website', icon: Home },
    ]
  },
  {
    title: 'Learning',
    items: [
      { label: 'My Classes', href: '/dashboard/student/online-classe', icon: BookOpen },
      { label: 'My Tutorials', href: '/dashboard/student/tutorials', icon: Brain },
      { label: 'Wishlist', href: '/dashboard/student/wishlist', icon: Heart },
      { label: 'Assignments', href: '/dashboard/student/assignments', icon: FileText },
      { label: 'Certificates', href: '/dashboard/student/certificates', icon: GraduationCap },
    ]
  },
  {
    title: 'Instructors & Bookings',
    items: [
      { label: 'Instructors', href: '/dashboard/student/instructors', icon: User },
      { label: 'My Bookings', href: '/dashboard/student/bookings', icon: CalendarCheck2 },
      { label: 'Messages', href: '/dashboard/student/messages/messages', icon: MessageSquareMore },
    ]
  },
  {
    title: 'Offers & Groups',
    items: [
      { label: 'Offers', href: '/dashboard/student/offers', icon: ClipboardList },
      { label: 'Explore Groups', href: '/dashboard/student/groups/explore', icon: Users },
      { label: 'My Groups', href: '/dashboard/student/groups/my-groups', icon: Users2 },
    ]
  },
  {
    title: 'Payments & Social',
    items: [
      { label: 'Payments', href: '/dashboard/student/payments', icon: CreditCard },
      { label: 'Community', href: '/dashboard/student/community', icon: UsersRound },
      { label: 'My Reviews', href: '/dashboard/student/reviews', icon: FileSignature },
    ]
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/dashboard/student/profile', icon: User },
      { label: 'Support', href: '/dashboard/student/support', icon: LifeBuoy },
      { label: 'Settings', href: '/dashboard/student/settings', icon: Settings },
    ]
  }
];
