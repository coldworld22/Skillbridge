// Sidebar.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDown, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAppConfigStore from '@/store/appConfigStore';
import { API_BASE_URL } from '@/config/config';
import logo from '@/shared/assets/images/login/logo.png';

import { adminNavLinks } from './SidebarLinks/adminLinks';
import { instructorNavLinks } from './SidebarLinks/instructorLinks';
import { studentNavLinks } from './SidebarLinks/studentLinks';

const navMap = {
  admin: adminNavLinks,
  instructor: instructorNavLinks,
  student: studentNavLinks
};

export default function Sidebar({ role = 'admin' }) {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  const navLinks = navMap[role] || [];

  const toggleDropdown = (label) => {
    setActiveDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-lg p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <img
            src={settings.logo_url ? `${API_BASE_URL}${settings.logo_url}` : logo.src || logo}
            alt={`${settings.appName || 'SkillBridge'} Logo`}
            className="w-12 h-12 rounded-full object-contain shadow"
          />
          <h2 className="text-2xl font-extrabold text-yellow-500">
            {settings.appName || 'SkillBridge'}
          </h2>
        </div>

        <nav className="space-y-2">
          {navLinks.map(({ title, items }) => (
            <div key={title} className="mb-4">
              <h3 className="text-xs font-semibold text-yellow-500 dark:text-yellow-400 uppercase tracking-wide px-4 mb-1 flex items-center gap-1">
                {title} <Plus size={14} />
              </h3>
              <div className="space-y-1">
                {items.map(({ label, href, icon: Icon, isDropdown, dropdown }) => {
                  const isActive = isHydrated && router.pathname.startsWith(href);

                  if (isDropdown) {
                    return (
                      <div key={label} className="space-y-1">
                        <div
                          onClick={() => toggleDropdown(label)}
                          className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${activeDropdown === label ? 'bg-yellow-400 text-white shadow-md' : 'text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                          <ChevronDown className={`w-4 h-4 transform transition-transform ${activeDropdown === label ? 'rotate-180' : ''}`} />
                        </div>

                        {activeDropdown === label && dropdown && (
                          <div className="pl-6 space-y-1">
                            {dropdown.map(({ href, label, icon: SubIcon }) => (
                              <Link href={href} key={href} legacyBehavior>
                                <a
                                  className={`flex items-center gap-2 px-4 py-1 text-sm rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isHydrated && router.pathname.startsWith(href)
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                  <SubIcon className="w-4 h-4" />
                                  {label}
                                </a>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link href={href} key={href} legacyBehavior>
                      <a
                        className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive ? 'bg-yellow-400 text-white shadow-md' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
        &copy; {new Date().getFullYear()} {settings.appName || 'SkillBridge'}
      </div>
    </aside>
  );
}
