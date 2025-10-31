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
import { ADMIN_PERMISSIONS } from '@/constants/adminPermissions';

export const adminNavLinks = [
  {
    title: 'overview',
    items: [
      {
        label: 'dashboard',
        href: '/dashboard/admin',
        icon: LayoutDashboard,
        requiredPermissions: [ADMIN_PERMISSIONS.DASHBOARD.VIEW],
      },
      { label: 'go_to_website', href: '/website', icon: Home }
    ]
  },
  {
    title: 'learning_management',
    items: [
      {
        label: 'manage_classes',
        href: '/dashboard/admin/online-classes',
        icon: BookOpen,
        requiredPermissions: [ADMIN_PERMISSIONS.ONLINE_CLASSES.VIEW],
      },
      {
        label: 'manage_tutorials',
        href: '/dashboard/admin/tutorials',
        icon: Brain,
        requiredPermissions: [ADMIN_PERMISSIONS.TUTORIALS.VIEW],
      },
      {
        label: 'assignments',
        href: '/dashboard/admin/assignments',
        icon: FileText,
        requiredPermissions: [ADMIN_PERMISSIONS.ASSIGNMENTS.VIEW],
      },
      {
        label: 'certificates',
        href: '/dashboard/admin/certificates',
        icon: LayoutTemplate,
        requiredPermissions: [ADMIN_PERMISSIONS.CERTIFICATES.VIEW],
      },
      {
        label: 'categories',
        href: '/dashboard/admin/categories',
        icon: FolderKanban,
        requiredPermissions: [ADMIN_PERMISSIONS.CATEGORIES.VIEW],
      },
      {
        label: 'books',
        href: '/dashboard/admin/books',
        icon: Book,
        requiredPermissions: [ADMIN_PERMISSIONS.BOOKS.VIEW],
      }
    ]
  },
  {
    title: 'people_community',
    items: [
      {
        label: 'instructors',
        href: '/dashboard/admin/instructors',
        icon: Users,
        requiredPermissions: [ADMIN_PERMISSIONS.INSTRUCTORS.VIEW],
      },
      {
        label: 'users',
        href: '/dashboard/admin/users',
        icon: UserCog,
        requiredPermissions: [ADMIN_PERMISSIONS.USERS.VIEW],
      },
      {
        label: 'bookings',
        href: '/dashboard/admin/bookings',
        icon: CalendarCheck2,
        requiredPermissions: [ADMIN_PERMISSIONS.BOOKINGS.VIEW],
      },
      {
        label: 'community',
        href: '/dashboard/admin/community',
        icon: Users,
        requiredPermissions: [ADMIN_PERMISSIONS.COMMUNITY.VIEW],
      },
      {
        label: 'community_groups',
        href: '/dashboard/admin/groups',
        icon: Users,
        requiredPermissions: [ADMIN_PERMISSIONS.GROUPS.VIEW],
      },
      {
        label: 'messages',
        href: '/messages',
        icon: MessageCircle,
        requiredPermissions: [ADMIN_PERMISSIONS.MESSAGES.VIEW],
      },
      {
        label: 'roles',
        href: '/dashboard/admin/roles',
        icon: ShieldCheck,
        requiredPermissions: [ADMIN_PERMISSIONS.ROLES.VIEW],
      },
      {
        label: 'permissions',
        href: '/dashboard/admin/permissions',
        icon: Key,
        requiredPermissions: [ADMIN_PERMISSIONS.PERMISSIONS.VIEW],
      }
    ]
  },
  {
    title: 'monetization',
    items: [
      {
        label: 'subscription_plans',
        href: '/dashboard/admin/plans',
        icon: BadgeCheck,
       requiredPermissions: [ADMIN_PERMISSIONS.PLANS.VIEW],
      },
      {
        label: 'payment_config',
        href: '/dashboard/admin/payments',
        icon: CreditCard,
        requiredPermissions: [ADMIN_PERMISSIONS.PAYMENTS.VIEW],
      },
      {
        label: 'ads_manager',
        href: '/dashboard/admin/ads',
        icon: Megaphone,
        requiredPermissions: [ADMIN_PERMISSIONS.ADS.VIEW],
      },
      {
        label: 'offers',
        href: '/dashboard/admin/offers',
        icon: ClipboardList,
        requiredPermissions: [ADMIN_PERMISSIONS.OFFERS.VIEW],
      },
      {
        label: 'coupons',
        href: '/dashboard/admin/coupons',
        icon: BadgePercent,
        requiredPermissions: [ADMIN_PERMISSIONS.COUPONS.VIEW],
      },
      {
        label: 'support',
        href: '/dashboard/admin/support',
        icon: LifeBuoy,
        requiredPermissions: [ADMIN_PERMISSIONS.SUPPORT.VIEW],
      }
    ]
  },
  {
    title: 'settings',
    items: [
      {
        label: 'clear_cache',
        href: '/dashboard/admin/cache',
        icon: RefreshCcw,
        requiredPermissions: [ADMIN_PERMISSIONS.CACHE.MANAGE],
        action: 'clearCache',
      },
      {
        label: 'settings',
        href: '#',
        icon: Settings,
        isDropdown: true,
        dropdown: [
          {
            label: 'language_manager',
            href: '/dashboard/admin/settings/languages',
            icon: Globe,
            requiredPermissions: [ADMIN_PERMISSIONS.LANGUAGES.VIEW],
          },
          {
            label: 'language_config',
            href: '/dashboard/admin/settings/language-config',
            icon: Globe,
            requiredPermissions: [ADMIN_PERMISSIONS.LANGUAGE_CONFIG.VIEW],
          },
          {
            label: 'currency_manager',
            href: '/dashboard/admin/settings/currency',
            icon: DollarSign,
            requiredPermissions: [ADMIN_PERMISSIONS.CURRENCIES.VIEW],
          },
          {
            label: 'social_logins',
            href: '/dashboard/admin/settings/social_login',
            icon: Network,
            requiredPermissions: [ADMIN_PERMISSIONS.SOCIAL_LOGINS.VIEW],
          },
          {
            label: 'email_config',
            href: '/dashboard/admin/settings/email-config',
            icon: Mail,
            requiredPermissions: [ADMIN_PERMISSIONS.EMAIL_CONFIG.VIEW],
          },
          {
            label: 'messages_config',
            href: '/dashboard/admin/settings/messages-config',
            icon: MessageCircle,
            requiredPermissions: [ADMIN_PERMISSIONS.MESSAGES_CONFIG.VIEW],
          },
          {
            label: 'policies',
            href: '/dashboard/admin/settings/policies',
            icon: FileSignature,
            requiredPermissions: [ADMIN_PERMISSIONS.POLICIES.VIEW],
          },
          {
            label: 'contact_info',
            href: '/dashboard/admin/settings/contact',
            icon: Contact,
            requiredPermissions: [ADMIN_PERMISSIONS.CONTACT_INFO.VIEW],
          },
          {
            label: 'blogs',
            href: '/dashboard/admin/settings/blog',
            icon: BookMarked,
            requiredPermissions: [ADMIN_PERMISSIONS.BLOGS.VIEW],
          },
          {
            label: 'faqs',
            href: '/dashboard/admin/settings/faqs',
            icon: HelpCircle,
            requiredPermissions: [ADMIN_PERMISSIONS.FAQS.VIEW],
          },
          {
            label: 'app_settings',
            href: '/dashboard/admin/settings/app',
            icon: Settings,
            requiredPermissions: [ADMIN_PERMISSIONS.APP_SETTINGS.VIEW],
          },
          {
            label: 'footer_settings',
            href: '/dashboard/admin/settings/footer',
            icon: FileSignature,
            requiredPermissions: [ADMIN_PERMISSIONS.FOOTER_SETTINGS.VIEW],
          },
          {
            label: 'seo_manager',
            href: '/dashboard/admin/settings/seo',
            icon: SearchCheck,
            requiredPermissions: [ADMIN_PERMISSIONS.SEO_SETTINGS.VIEW],
          },
          {
            label: 'popups_alerts',
            href: '/dashboard/admin/settings/popup-announcement',
            icon: BellRing,
            requiredPermissions: [ADMIN_PERMISSIONS.POPUPS.VIEW],
          },
          {
            label: 'certificate_templates',
            href: '/dashboard/admin/settings/certificates',
            icon: LayoutTemplate,
            requiredPermissions: [ADMIN_PERMISSIONS.CERTIFICATE_TEMPLATES.VIEW],
          },
          {
            label: 'third_parties_config',
            href: '/dashboard/admin/settings/thirdParty',
            icon: Brain,
            requiredPermissions: [ADMIN_PERMISSIONS.THIRD_PARTY_CONFIG.VIEW],
          }
        ]
      }
    ]
  }
];
