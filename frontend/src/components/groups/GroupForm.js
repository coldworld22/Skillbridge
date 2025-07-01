import { useState, useEffect } from 'react';
import { X, Mail, Bell, MessageSquare, Smartphone, Send, Image as ImageIcon, Tag, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import groupService from '@/services/groupService';
import { fetchAllCategories } from '@/services/admin/categoryService';
import userService from '@/services/profile/userService';
import { sendChatMessage } from '@/services/messageService';
import { createNotification } from '@/services/notificationService';
import { API_BASE_URL } from '@/config/config';


export default function GroupForm() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
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
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
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
    (u) => !["admin", "superadmin"].includes(u.role?.toLowerCase())
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
      await groupService.createGroup({
        name: groupName,
        description,
        visibility: type || 'public',
        requires_approval: type === 'public',
        cover_image: null,
        category_id: category || null,
        tags,
      });
      toast.success('Group created successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvites = async () => {
    if (!inviteMethods.length) {
      toast.error('Please select at least one invite method.');
      return;
    }

    try {
      if (inviteMethods.includes('platform')) {
        for (const user of invitedUsers) {
          await sendChatMessage(user.id, {
            text: `You are invited to join the group ${groupName}`,
          });
        }
      }
      if (inviteMethods.includes('notification')) {
        for (const user of invitedUsers) {
          await createNotification({
            user_id: user.id,
            type: 'group_invite',
            message: `You are invited to join the group ${groupName}`,
          });
        }
      }
      toast.success(
        `Invites sent via ${inviteMethods.join(', ')} to ${invitedUsers.length} user(s).`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invitations');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🛠 Create New Group</h2>

      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <h3 className="text-md font-semibold text-gray-700 border-b pb-1">📄 General Info</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Group Name</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Group Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="">Select Type</option>
            <option value="private">Private (Invite Only)</option>
            <option value="public">Public (Anyone can request)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Tag size={14} /> Group Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="">Select a category</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              className="border px-3 py-2 rounded w-full"
            />
            <button type="button" onClick={handleTagAdd} className="bg-yellow-600 text-white px-3 py-2 rounded text-sm">Add</button>
          </div>
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Group Size</label>
          <input
            type="number"
            min="1"
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
            placeholder="Enter maximum number of members"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. Asia/Riyadh"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>
      </div>

      {type === 'private' && (
        <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
          <h3 className="text-md font-semibold text-gray-700 border-b pb-1">📨 Invite Members</h3>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or WhatsApp..."
            className="w-full border border-gray-300 px-3 py-2 rounded mb-3"
          />

          <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
          {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUserInvite(user)}
                className={`w-[calc(33%-0.75rem)] p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex gap-3 items-center transition-all ${
                  invitedUsers.some((u) => u.id === user.id)
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'border-gray-200'
                }`}
              >

                <img src={getAvatarUrl(user)} alt={user.name} className="w-10 h-10 rounded-full object-cover" />

                <div className="flex-1">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email} · {user.phone}</div>
                </div>
                <input type="checkbox" readOnly checked={invitedUsers.some((u) => u.id === user.id)} />
              </div>
            ))}
          </div>

          {invitedUsers.length > 0 && (
            <div className="flex gap-2 mt-2 items-center">
              {invitedUsers.slice(0, 10).map((u) => (
                <img
                  key={u.id}
                  src={getAvatarUrl(u)}
                  alt={u.name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
              ))}
              {invitedUsers.length > 10 && (
                <span className="text-xs text-gray-500">+{invitedUsers.length - 10} more</span>
              )}
            </div>
          )}

          {invitedUsers.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-4 items-center">
                <label className="text-sm font-medium">Notification methods:</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: 'email', icon: <Mail size={14} />, label: 'Email' },
                    { value: 'whatsapp', icon: <Smartphone size={14} />, label: 'WhatsApp' },
                    { value: 'platform', icon: <MessageSquare size={14} />, label: 'Platform' },
                    { value: 'notification', icon: <Bell size={14} />, label: 'Notification' },
                  ].map((method) => (
                    <label key={method.value} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        value={method.value}
                        checked={inviteMethods.includes(method.value)}
                        onChange={() => toggleInviteMethod(method.value)}
                      />
                      {method.icon} {method.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select at least one method to notify invited users.</p>
              </div>
              <button
                type="button"
                onClick={handleSendInvites}
                className="inline-flex items-center gap-2 text-sm text-yellow-600 hover:underline"
              >
                <Send size={16} /> Send Invitations
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        className={`w-full px-4 py-2 rounded font-medium text-white ${
          isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Group'}
      </button>
    </form>
  );
}
