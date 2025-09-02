// SidebarLinks/instructorLinks.js
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck2,
  Users,
  Users2,
  CreditCard,
  FileText,
  GraduationCap,
  PlusCircle,
  Brain,
  Megaphone,
  ClipboardList,
  BadgePercent,
  MailOpen,
  MessageCircle,
  CalendarRange,
  Star,
  LifeBuoy,
  UsersRound,
  Home,
  Book,
  Settings
} from 'lucide-react';

export const instructorNavLinks = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/instructor', icon: LayoutDashboard },
      { label: 'Go to Website', href: '/website', icon: Home },
    ]
  },
  {
    title: 'Online Classes',
    items: [
      { label: 'Create Class', href: '/dashboard/instructor/online-classes/create', icon: PlusCircle },
      { label: 'My Classes', href: '/dashboard/instructor/online-classes', icon: BookOpen },
    ]
  },
  {
    title: 'Tutorials',
    items: [
      { label: 'My Tutorials', href: '/dashboard/instructor/tutorials', icon: Brain },
      { label: 'Create Tutorial', href: '/dashboard/instructor/tutorials/create', icon: PlusCircle },
    ]
  },
  {
    title: 'Books',
    items: [
      { label: 'Create Book', href: '/dashboard/instructor/books/create', icon: PlusCircle },
      { label: 'My Books', href: '/dashboard/instructor/books', icon: Book },
    ]
  },
  {
    title: 'Bookings',
    items: [
      { label: 'Requests', href: '/dashboard/instructor/requests', icon: MailOpen },
      { label: 'Schedule', href: '/dashboard/instructor/schedule', icon: CalendarCheck2 },
      { label: 'Bookings', href: '/dashboard/instructor/bookings', icon: CalendarCheck2 },
      { label: 'Availability', href: '/dashboard/instructor/availability', icon: CalendarRange },
      { label: 'Messages', href: '/messages', icon: MessageCircle },
      { label: 'Reviews', href: '/dashboard/instructor/reviews', icon: Star },
    ]
  },
  {
    title: 'Teaching & Students',
    items: [
      { label: 'Assignments', href: '/dashboard/instructor/assignments', icon: FileText },
      { label: 'Certificates', href: '/dashboard/instructor/certificates', icon: GraduationCap },
      { label: 'Students', href: '/dashboard/instructor/students', icon: Users },
    ]
  },
  {
    title: 'Community',
    items: [
      { label: 'Community', href: '/dashboard/instructor/community', icon: UsersRound },
      { label: 'Explore Groups', href: '/dashboard/instructor/groups/explore', icon: Users },
      { label: 'My Groups', href: '/dashboard/instructor/groups/my-groups', icon: Users2 },
      { label: 'Support', href: '/dashboard/instructor/support', icon: LifeBuoy },
    ]
  },
  {
    title: 'Monetization',
    items: [
      { label: 'Earnings', href: '/dashboard/instructor/payments', icon: CreditCard },
      { label: 'Ads Manager', href: '/dashboard/instructor/ads', icon: Megaphone },
      { label: 'Offers', href: '/dashboard/instructor/offers', icon: ClipboardList },
      { label: 'Coupons', href: '/dashboard/instructor/coupons', icon: BadgePercent },
    ]
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/dashboard/instructor/profile', icon: GraduationCap },
      { label: 'Settings', href: '/dashboard/instructor/settings', icon: Settings },
    ]
  }
];
