import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/layouts/StudentLayout';
import toast from 'react-hot-toast';
import groupService from '@/services/groupService';

export default function MyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All Groups', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'admin', label: 'Admin', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'member', label: 'Member', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'pending', label: 'Pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  useEffect(() => {
    setIsLoading(true);
    groupService
      .getMyGroups()
      .then((data) => {
        setGroups(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load groups');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = activeTab === 'all' ? groups : groups.filter((g) => g.role === activeTab);

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredGroups(filtered);
    setVisibleCount(6); // Reset visible count when filters change
  }, [groups, activeTab, sortBy]);

  const cancelJoinRequest = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success('Join request cancelled.');
  };

  const renderGroupCard = (group) => (
    <div 
      key={group.id} 
      className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 truncate max-w-[180px]">{group.name}</h3>
        <span
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
            group.role === 'admin'
              ? 'bg-green-50 text-green-700 border-green-100'
              : group.role === 'member'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-yellow-50 text-yellow-800 border-yellow-100'
          }`}
        >
          {group.role === 'admin' && '👑 Admin'}
          {group.role === 'member' && '🙋 Member'}
          {group.role === 'pending' && '⏳ Pending'}
        </span>
      </div>
      
      <div className="relative h-40 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={group.cover_image || group.image || '/images/group-placeholder.jpg'}
          alt={group.name}
          className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
          onError={(e) => {
            e.target.src = '/images/group-placeholder.jpg';
          }}
        />
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 h-[40px]">{group.description || 'No description provided'}</p>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {group.membersCount ?? group.members_count ?? 0} members
        </p>
        
        <div className="flex -space-x-2">
          {[...Array(Math.min(3, group.membersCount || 0))].map((_, i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/40?img=${i + 1}`}
              className="w-6 h-6 rounded-full border-2 border-white"
              alt="member avatar"
            />
          ))}
          {(group.membersCount || 0) > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
              +{(group.membersCount || 0) - 3}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 flex gap-2 border-t border-gray-100">
        {group.role === 'admin' && (
          <Link href={`/dashboard/student/groups/${group.id}`}>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md w-full flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manage
            </button>
          </Link>
        )}
        {group.role === 'member' && (
          <Link href={`/dashboard/student/groups/${group.id}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md w-full flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Open
            </button>
          </Link>
        )}
        {group.role === 'pending' && (
          <>
            <button
              disabled
              className="bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-md text-sm font-medium cursor-not-allowed w-full flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending
            </button>
            <button
              onClick={() => cancelJoinRequest(group.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              My Groups
            </h1>
            <p className="text-gray-500 mt-1">View and manage all your groups in one place</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <Link href="/dashboard/student/groups/explore">
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Explore Groups
              </button>
            </Link>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {filteredGroups.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.slice(0, visibleCount).map(renderGroupCard)}
                </div>
                {visibleCount < filteredGroups.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="px-6 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors duration-200 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Load More Groups
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {activeTab === 'all' ? 'No groups yet' : `No ${activeTab} groups`}
                </h3>
                <p className="mt-2 text-gray-500">
                  {activeTab === 'all'
                    ? "You haven't joined any groups yet."
                    : `You don't have any groups where you're ${activeTab}.`}
                </p>
                <div className="mt-6">
                  <Link href="/dashboard/student/groups/explore">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200">
                      Explore Groups
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}