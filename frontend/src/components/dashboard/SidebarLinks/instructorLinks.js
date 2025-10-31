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
    title: 'overview',
    items: [
      { label: 'dashboard', href: '/dashboard/instructor', icon: LayoutDashboard },
      { label: 'go_to_website', href: '/website', icon: Home },
    ]
  },
  {
    title: 'online_classes',
    items: [
      { label: 'create_class', href: '/dashboard/instructor/online-classes/create', icon: PlusCircle },
      { label: 'my_classes', href: '/dashboard/instructor/online-classes', icon: BookOpen },
    ]
  },
  {
    title: 'tutorials',
    items: [
      { label: 'my_tutorials', href: '/dashboard/instructor/tutorials', icon: Brain },
      { label: 'create_tutorial', href: '/dashboard/instructor/tutorials/create', icon: PlusCircle },
    ]
  },
  {
    title: 'books',
    items: [
      { label: 'create_book', href: '/dashboard/instructor/books/create', icon: PlusCircle },
      { label: 'my_books', href: '/dashboard/instructor/books', icon: Book },
    ]
  },
  {
    title: 'bookings',
    items: [
      { label: 'requests', href: '/dashboard/instructor/requests', icon: MailOpen },
      { label: 'schedule', href: '/dashboard/instructor/schedule', icon: CalendarCheck2 },
      { label: 'bookings', href: '/dashboard/instructor/bookings', icon: CalendarCheck2 },
      { label: 'availability', href: '/dashboard/instructor/availability', icon: CalendarRange },
      { label: 'messages', href: '/messages', icon: MessageCircle },
      { label: 'reviews', href: '/dashboard/instructor/reviews', icon: Star },
    ]
  },
  {
    title: 'teaching_students',
    items: [
      { label: 'assignments', href: '/dashboard/instructor/assignments', icon: FileText },
      { label: 'certificates', href: '/dashboard/instructor/certificates', icon: GraduationCap },
      { label: 'students', href: '/dashboard/instructor/students', icon: Users },
    ]
  },
  {
    title: 'community',
    items: [
      { label: 'community', href: '/dashboard/instructor/community', icon: UsersRound },
      { label: 'explore_groups', href: '/dashboard/instructor/groups/explore', icon: Users },
      { label: 'my_groups', href: '/dashboard/instructor/groups/my-groups', icon: Users2 },
      { label: 'support', href: '/dashboard/instructor/support', icon: LifeBuoy },
    ]
  },
  {
    title: 'monetization',
    items: [
      { label: 'earnings', href: '/dashboard/instructor/payments', icon: CreditCard },
      { label: 'ads_manager', href: '/dashboard/instructor/ads', icon: Megaphone },
      { label: 'offers', href: '/dashboard/instructor/offers', icon: ClipboardList },
      { label: 'coupons', href: '/dashboard/instructor/coupons', icon: BadgePercent },
    ]
  },
  {
    title: 'account',
    items: [
      { label: 'settings', href: '/dashboard/instructor/settings', icon: Settings },
    ]
  }
];
