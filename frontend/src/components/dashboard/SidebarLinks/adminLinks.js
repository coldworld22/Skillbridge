// SidebarLinks/adminLinks.js
import {
  LayoutDashboard, CreditCard, Users, BadgeCheck, BookOpen, Brain, FileText, CalendarCheck2,
  UserCog, Megaphone, Settings, Phone, Plug, Globe, Mail, ImageIcon, ShieldCheck,
  Key, MessageCircleQuestion, BellRing, FileSignature, LayoutTemplate, Contact,
  SearchCheck, ClipboardList, FolderKanban, DollarSign, Home, MessageCircle, Network, BookMarked,            // For Blogs
  HelpCircle,            // For FAQs
  LifeBuoy
} from 'lucide-react';

export const adminNavLinks = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Go to Website', href: '/website', icon: Home }
    ]
  },
  {
    title: 'Learning Management',
    items: [
      { label: 'Manage Classes', href: '/dashboard/admin/online-classes', icon: BookOpen },
      { label: 'Manage Tutorials', href: '/dashboard/admin/tutorials', icon: Brain },
      { label: 'Assignments', href: '/dashboard/admin/assignments', icon: FileText },
      { label: 'Certificates', href: '/dashboard/admin/certificates', icon: LayoutTemplate },
      { label: 'Categories', href: '/dashboard/admin/categories', icon: FolderKanban },
    ]
  },
  {
    title: 'People & Community',
    items: [
      { label: 'Instructors', href: '/dashboard/admin/instructors', icon: Users },
      { label: 'Users', href: '/dashboard/admin/users', icon: UserCog },
      { label: 'Bookings', href: '/dashboard/admin/bookings', icon: CalendarCheck2 },
      { label: 'Community', href: '/dashboard/admin/community', icon: Users },
      { label: 'Community Groups', href: '/dashboard/admin/groups', icon: Users },
      { label: 'Roles', href: '/dashboard/admin/roles', icon: ShieldCheck },
      { label: 'Permissions', href: '/dashboard/admin/permissions', icon: Key },
    ]
  },
  {
    title: 'Monetization',
    items: [
      { label: 'Subscription Plans', href: '/dashboard/admin/plans', icon: BadgeCheck },
      { label: 'Payment Config', href: '/dashboard/admin/payments', icon: CreditCard },
      { label: 'Ads Manager', href: '/dashboard/admin/ads', icon: Megaphone },
      { label: 'Offers', href: '/dashboard/admin/offers', icon: ClipboardList },
      { label: 'Support', href: '/dashboard/admin/support', icon: LifeBuoy },
    ]
  },
  {
    title: 'Settings',
    items: [
      {
        label: 'Settings',
        href: '#',
        icon: Settings,
        isDropdown: true,
        dropdown: [
          { label: 'Language Manager', href: '/dashboard/admin/settings/languages', icon: Globe },
          { label: 'Currency Manager ', href: '/dashboard/admin/settings/currency', icon: DollarSign },
          { label: 'Social Logins', href: '/dashboard/admin/settings/social_login', icon: Network },
          { label: 'Email Config', href: '/dashboard/admin/settings/email-config', icon: Mail },
          { label: 'Messages Config', href: '/dashboard/admin/settings/messages-config', icon: MessageCircle },
          { label: 'Policies', href: '/dashboard/admin/settings/policies', icon: FileSignature },
          { label: 'Contact Info', href: '/dashboard/admin/settings/contact', icon: Contact },
          { label: 'Blogs', href: '/dashboard/admin/settings/blog', icon: BookMarked },
          { label: 'FAQs', href: '/dashboard/admin/settings/faqs', icon: HelpCircle },


          { label: 'Footer Settings', href: '/dashboard/admin/settings/footer', icon: FileSignature },

          { label: 'SEO Manager', href: '/dashboard/admin/settings/seo', icon: SearchCheck },
          { label: 'Popups / Alerts', href: '/dashboard/admin/settings/popup-announcement', icon: BellRing },
          { label: 'Certificate Templates', href: '/dashboard/admin/settings/certificates', icon: LayoutTemplate },
          { label: 'Third Parties Config', href: '/dashboard/admin/settings/thirdParty', icon: Brain }
        ]
      }
    ]
  }
];
