import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';
import { X, Mail, Bell, MessageSquare, Smartphone, Send, Image as ImageIcon, Tag, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import groupService from '@/services/groupService';
import { fetchAllCategories } from '@/services/admin/categoryService';
import userService from '@/services/profile/userService';
import { sendChatMessage } from '@/services/messageService';
import { createNotification } from '@/services/notificationService';
import { API_BASE_URL } from '@/config/config';

export default function GroupForm() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteMethods, setInviteMethods] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [maxSize, setMaxSize] = useState('');
  const [timezone, setTimezone] = useState('');

  const getAvatarUrl = (user) => {
    const url =
      user.avatar ||
      user.avatar_url ||
      user.profileImage ||
      user.profile_image ||
      '';
    if (!url) return '/images/default-avatar.png';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'))
      return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${clean}`;

  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const cats = await fetchAllCategories();
        setAvailableCategories(cats?.data || cats || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
      try {
        const tags = await groupService.getTags();
        setAvailableTags(tags || []);
      } catch (err) {
        console.error('Failed to load tags', err);
      }
      try {
        const result = await userService.searchUsers('');
        setUsers(result);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const search = async () => {
      try {
        const result = await userService.searchUsers(query);
        setUsers(result);
      } catch {
        setUsers([]);
      }
    };
    search();
  }, [query]);

  const filteredUsers = users.filter(
    (u) => !['admin', 'superadmin'].includes(u.role?.toLowerCase())
  );

  const toggleUserInvite = (user) => {
    if (invitedUsers.some((u) => u.id === user.id)) {
      setInvitedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setInvitedUsers((prev) => [...prev, user]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagSelect = (tag) => {
    const name = typeof tag === 'string' ? tag : tag.name;
    if (!tags.includes(name)) setTags([...tags, name]);
  };

  const toggleInviteMethod = (method) => {
    setInviteMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', groupName);
      payload.append('description', description);
      payload.append('visibility', type || 'public');
      payload.append('requires_approval', type === 'public');
      if (imageFile) payload.append('cover_image', imageFile);
      if (category) payload.append('category_id', category);
      if (tags.length) payload.append('tags', JSON.stringify(tags));
      if (maxSize) payload.append('max_size', maxSize);
      if (timezone) payload.append('timezone', timezone);

      const group = await groupService.createGroup(payload);
      toast.success('Group created successfully!');
      const role = user?.role?.toLowerCase();
      const path =
        role === 'instructor'
          ? '/dashboard/instructor/groups/my-groups'
          : role === 'student'
          ? '/dashboard/student/groups/my-groups'
          : '/dashboard/admin/groups';
      router.push(path);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvites = async () => {
    try {
      for (const user of invitedUsers) {
        // always send message and notification
        await sendChatMessage(user.id, {
          text: `You are invited to join the group ${groupName}`,
        });
        await createNotification({
          user_id: user.id,
          type: 'group_invite',
          message: `You are invited to join the group ${groupName}`,
        });
      }

      if (inviteMethods.includes('email') || inviteMethods.includes('whatsapp')) {
        toast.info(`Additional invite methods: ${inviteMethods.join(', ')}`);
      }

      toast.success(
        `Invites sent to ${invitedUsers.length} member${invitedUsers.length !== 1 ? 's' : ''}.`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invitations');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto border border-gray-100">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
            <Users size={20} />
          </span>
          Create New Group
        </h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to create your new group</p>
      </div>

      {/* General Info Section */}
      <div className="space-y-6 p-6 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Tag size={18} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">General Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Group Name *</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Group Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Select Type</option>
              <option value="private">Private (Invite Only)</option>
              <option value="public">Public (Anyone can request)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Tell members what this group is about..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Group Avatar</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                  <ImageIcon size={24} className="text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                  {imagePreview ? 'Change' : 'Upload'}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Max Group Size</label>
            <input
              type="number"
              min="1"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="No limit if empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Riyadh"
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">Tags</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTagAdd()}
              placeholder="Add a tag and press Enter"
              className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <button 
              type="button" 
              onClick={handleTagAdd} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Add
            </button>
          </div>
          
          {availableTags.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full transition flex items-center gap-1"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  {tag}
                  <button 
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Members Section */}
      {type === 'private' && (
        <div className="space-y-6 p-6 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Mail size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Invite Members</h3>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Search Members</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUserInvite(user)}
                className={`p-3 border rounded-lg cursor-pointer transition-all flex gap-3 items-center ${
                  invitedUsers.some((u) => u.id === user.id)
                    ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <img 
                  src={getAvatarUrl(user)} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  invitedUsers.some((u) => u.id === user.id) 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-white border-gray-300'
                }`}>
                  {invitedUsers.some((u) => u.id === user.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {invitedUsers.length > 0 && (
            <>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Selected Members ({invitedUsers.length})</label>
                <div className="flex flex-wrap gap-2">
                  {invitedUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 bg-blue-50 rounded-full pl-2 pr-3 py-1 border border-blue-100">
                      <img
                        src={getAvatarUrl(u)}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover border border-white"
                      />
                      <span className="text-xs font-medium text-gray-700">{u.name.split(' ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => toggleUserInvite(u)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Invitation Methods</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'email', icon: <Mail size={16} />, label: 'Email' },
                      { value: 'whatsapp', icon: <Smartphone size={16} />, label: 'WhatsApp' },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                          inviteMethods.includes(method.value)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          inviteMethods.includes(method.value)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.icon}
                        </div>
                        <span className="text-sm font-medium">{method.label}</span>
                        <input
                          type="checkbox"
                          value={method.value}
                          checked={inviteMethods.includes(method.value)}
                          onChange={() => toggleInviteMethod(method.value)}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendInvites}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send size={16} />
                  Send Invitations to {invitedUsers.length} Member{invitedUsers.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className={`px-6 py-3 rounded-lg font-medium text-white transition ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-md'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Group...
            </span>
          ) : (
            'Create Group'
          )}
        </button>
      </div>
    </form>
  );
}
