// SidebarLinks/adminLinks.js
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BadgeCheck,
  BookOpen,
  Brain,
  FileText,
  CalendarCheck2,
  UserCog,
  Megaphone,
  Settings,
  Phone,
  Plug,
  Globe,
  Mail,
  ImageIcon,
  ShieldCheck,
  Key,
  MessageCircleQuestion,
  BellRing,
  FileSignature,
  LayoutTemplate,
  Contact,
  SearchCheck,
  ClipboardList,
  FolderKanban,
  DollarSign,
  Home,
  MessageCircle,
  Network,
  Book,
  BookMarked, // For Blogs
  HelpCircle, // For FAQs
  LifeBuoy,
  BadgePercent,
  RefreshCcw
} from 'lucide-react';

export const adminNavLinks = [
  {
    title: 'overview',
    items: [
      { label: 'dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'go_to_website', href: '/website', icon: Home }
    ]
  },
  {
    title: 'learning_management',
    items: [
      { label: 'manage_classes', href: '/dashboard/admin/online-classes', icon: BookOpen },
      { label: 'manage_tutorials', href: '/dashboard/admin/tutorials', icon: Brain },
      { label: 'assignments', href: '/dashboard/admin/assignments', icon: FileText },
      { label: 'certificates', href: '/dashboard/admin/certificates', icon: LayoutTemplate },
      { label: 'categories', href: '/dashboard/admin/categories', icon: FolderKanban },
      { label: 'books', href: '/dashboard/admin/books', icon: Book }
    ]
  },
  {
    title: 'people_community',
    items: [
      { label: 'instructors', href: '/dashboard/admin/instructors', icon: Users },
      { label: 'users', href: '/dashboard/admin/users', icon: UserCog },
      { label: 'bookings', href: '/dashboard/admin/bookings', icon: CalendarCheck2 },
      { label: 'community', href: '/dashboard/admin/community', icon: Users },
      { label: 'community_groups', href: '/dashboard/admin/groups', icon: Users },
      { label: 'roles', href: '/dashboard/admin/roles', icon: ShieldCheck },
      { label: 'permissions', href: '/dashboard/admin/permissions', icon: Key }
    ]
  },
  {
    title: 'monetization',
    items: [
      { label: 'subscription_plans', href: '/dashboard/admin/plans', icon: BadgeCheck },
      { label: 'payment_config', href: '/dashboard/admin/payments', icon: CreditCard },
      { label: 'ads_manager', href: '/dashboard/admin/ads', icon: Megaphone },
      { label: 'offers', href: '/dashboard/admin/offers', icon: ClipboardList },
      { label: 'coupons', href: '/dashboard/admin/coupons', icon: BadgePercent },
      { label: 'support', href: '/dashboard/admin/support', icon: LifeBuoy }
    ]
  },
  {
    title: 'settings',
    items: [
      { label: 'clear_cache', href: '/dashboard/admin/cache', icon: RefreshCcw },
      {
        label: 'settings',
        href: '#',
        icon: Settings,
        isDropdown: true,
        dropdown: [
          { label: 'language_manager', href: '/dashboard/admin/settings/languages', icon: Globe },
          { label: 'language_config', href: '/dashboard/admin/settings/language-config', icon: Globe },
          { label: 'currency_manager', href: '/dashboard/admin/settings/currency', icon: DollarSign },
          { label: 'social_logins', href: '/dashboard/admin/settings/social_login', icon: Network },
          { label: 'email_config', href: '/dashboard/admin/settings/email-config', icon: Mail },
          { label: 'messages_config', href: '/dashboard/admin/settings/messages-config', icon: MessageCircle },
          { label: 'policies', href: '/dashboard/admin/settings/policies', icon: FileSignature },
          { label: 'contact_info', href: '/dashboard/admin/settings/contact', icon: Contact },
          { label: 'blogs', href: '/dashboard/admin/settings/blog', icon: BookMarked },
          { label: 'faqs', href: '/dashboard/admin/settings/faqs', icon: HelpCircle },
          { label: 'app_settings', href: '/dashboard/admin/settings/app', icon: Settings },
          { label: 'footer_settings', href: '/dashboard/admin/settings/footer', icon: FileSignature },
          { label: 'seo_manager', href: '/dashboard/admin/settings/seo', icon: SearchCheck },
          { label: 'popups_alerts', href: '/dashboard/admin/settings/popup-announcement', icon: BellRing },
          { label: 'certificate_templates', href: '/dashboard/admin/settings/certificates', icon: LayoutTemplate },
          { label: 'third_parties_config', href: '/dashboard/admin/settings/thirdParty', icon: Brain }
        ]
      }
    ]
  }
];
