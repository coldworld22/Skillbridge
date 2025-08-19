// SidebarLinks/adminLinks.js
import {
  LayoutDashboard, CreditCard, Users, BadgeCheck, BookOpen, Brain, FileText, CalendarCheck2,
  UserCog, Megaphone, Settings, Phone, Plug, Globe, Mail, ImageIcon, ShieldCheck,
  Key, MessageCircleQuestion, BellRing, FileSignature, LayoutTemplate, Contact,
  SearchCheck, ClipboardList, FolderKanban, DollarSign, Home, MessageCircle, Network, Book, BookMarked,            // For Blogs
  HelpCircle,            // For FAQs
  LifeBuoy,
  BadgePercent
} from 'lucide-react';

export const getAdminNavLinks = (t) => [
  {
    title: t('Overview'),
    items: [
      { label: t('Dashboard'), href: '/dashboard/admin', icon: LayoutDashboard },
      { label: t('Go to Website'), href: '/website', icon: Home }
    ]
  },
  {
    title: t('Learning Management'),
    items: [
      { label: t('Manage Classes'), href: '/dashboard/admin/online-classes', icon: BookOpen },
      { label: t('Manage Tutorials'), href: '/dashboard/admin/tutorials', icon: Brain },
      { label: t('Assignments'), href: '/dashboard/admin/assignments', icon: FileText },
      { label: t('Certificates'), href: '/dashboard/admin/certificates', icon: LayoutTemplate },
      { label: t('Categories'), href: '/dashboard/admin/categories', icon: FolderKanban },
      { label: t('Books'), href: '/dashboard/admin/books', icon: Book },
    ]
  },
  {
    title: t('People & Community'),
    items: [
      { label: t('Instructors'), href: '/dashboard/admin/instructors', icon: Users },
      { label: t('Users'), href: '/dashboard/admin/users', icon: UserCog },
      { label: t('Bookings'), href: '/dashboard/admin/bookings', icon: CalendarCheck2 },
      { label: t('Community'), href: '/dashboard/admin/community', icon: Users },
      { label: t('Community Groups'), href: '/dashboard/admin/groups', icon: Users },
      { label: t('Roles'), href: '/dashboard/admin/roles', icon: ShieldCheck },
      { label: t('Permissions'), href: '/dashboard/admin/permissions', icon: Key },
    ]
  },
  {
    title: t('Monetization'),
    items: [
      { label: t('Subscription Plans'), href: '/dashboard/admin/plans', icon: BadgeCheck },
      { label: t('Payment Config'), href: '/dashboard/admin/payments', icon: CreditCard },
      { label: t('Ads Manager'), href: '/dashboard/admin/ads', icon: Megaphone },
      { label: t('Offers'), href: '/dashboard/admin/offers', icon: ClipboardList },
      { label: t('Coupons'), href: '/dashboard/admin/coupons', icon: BadgePercent },
      { label: t('Support'), href: '/dashboard/admin/support', icon: LifeBuoy },
    ]
  },
  {
    title: t('Settings'),
    items: [
      {
        label: t('Settings'),
        href: '#',
        icon: Settings,
        isDropdown: true,
        dropdown: [
          { label: t('Language Manager'), href: '/dashboard/admin/settings/languages', icon: Globe },
          { label: t('Language Config'), href: '/dashboard/admin/settings/language-config', icon: Globe },
          { label: t('Currency Manager'), href: '/dashboard/admin/settings/currency', icon: DollarSign },
          { label: t('Social Logins'), href: '/dashboard/admin/settings/social_login', icon: Network },
          { label: t('Email Config'), href: '/dashboard/admin/settings/email-config', icon: Mail },
          { label: t('Messages Config'), href: '/dashboard/admin/settings/messages-config', icon: MessageCircle },
          { label: t('Policies'), href: '/dashboard/admin/settings/policies', icon: FileSignature },
          { label: t('Contact Info'), href: '/dashboard/admin/settings/contact', icon: Contact },
          { label: t('Blogs'), href: '/dashboard/admin/settings/blog', icon: BookMarked },
          { label: t('FAQs'), href: '/dashboard/admin/settings/faqs', icon: HelpCircle },
          { label: t('App Settings'), href: '/dashboard/admin/settings/app', icon: Settings },

          { label: t('Footer Settings'), href: '/dashboard/admin/settings/footer', icon: FileSignature },

          { label: t('SEO Manager'), href: '/dashboard/admin/settings/seo', icon: SearchCheck },
          { label: t('Popups / Alerts'), href: '/dashboard/admin/settings/popup-announcement', icon: BellRing },
          { label: t('Certificate Templates'), href: '/dashboard/admin/settings/certificates', icon: LayoutTemplate },
          { label: t('Third Parties Config'), href: '/dashboard/admin/settings/thirdParty', icon: Brain }
        ]
      }
    ]
  }
];
