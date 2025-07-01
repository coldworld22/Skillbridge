import { useState, useEffect } from 'react';
import { X, Mail, Bell, MessageSquare, Smartphone, Send, Image as ImageIcon, Tag, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import groupService from '@/services/groupService';

const allUsers = [
  { id: 'u1', name: 'Ali Hassan', email: 'ali@example.com', phone: '+966500000001', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcUATNS9SzcJCCPuJ9OqlGynFYfxy2bOYVaw&s' },
  { id: 'u2', name: 'Sarah Youssef', email: 'sarah@example.com', phone: '+966500000002', avatar: 'https://media.jimco.com/wp-content/uploads/2021/05/01133126/HJ_JIMCO_Image_Web-1.jpg' },
  { id: 'u3', name: 'John Doe', email: 'john@example.com', phone: '+966500000003', avatar: 'https://left.eu/app/uploads/2024/07/HASSAN_Rima_FR_023-scaled.jpg' },
  { id: 'u4', name: 'Fatima Noor', email: 'fatima@example.com', phone: '+966500000004', avatar: 'https://cemse.kaust.edu.sa/sites/default/files/styles/medium/public/images/KAUST-CEMSE-CS-Ali-Hassan.jpg.webp?itok=PcI2Ge_o' },
  { id: 'u5', name: 'Omar Said', email: 'omar@example.com', phone: '+966500000005', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHH98-reZj7tZKtSFYHGE_cOXf6Qdg241Dzw&s' },
  { id: 'u6', name: 'Lina Abbas', email: 'lina@example.com', phone: '+966500000006', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
  { id: 'u7', name: 'Hassan Alami', email: 'hassan@example.com', phone: '+966500000007', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
  { id: 'u8', name: 'Maha Taleb', email: 'maha@example.com', phone: '+966500000008', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
  { id: 'u9', name: 'Salim Rajab', email: 'salim@example.com', phone: '+966500000009', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
  { id: 'u10', name: 'Dana Kamel', email: 'dana@example.com', phone: '+966500000010', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
  { id: 'u11', name: 'Yousef Jaber', email: 'yousef@example.com', phone: '+966500000011', avatar: 'https://thrive.princeton.edu/wp-content/uploads/sites/3/2019/09/Muhsin-Hassan.jpg' },
];

const mockCategories = ['Web Development', 'AI', 'Education', 'Design', 'Marketing'];
const mockTags = ['JavaScript', 'React', 'UI/UX', 'Backend', 'Data Science', 'Python', 'Blockchain'];

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
  const [maxSize, setMaxSize] = useState('');
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    setAvailableCategories(mockCategories);
  }, []);

  const visibleUsers = allUsers.slice(0, 10);
  const filteredUsers = query
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.phone.includes(query)
      )
    : visibleUsers;

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
    if (!tags.includes(tag)) setTags([...tags, tag]);
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
        requires_approval: false,
        cover_image: null,
      });
      toast.success('Group created successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvites = () => {
    if (!inviteMethods.length) {
      toast.error('Please select at least one invite method.');
      return;
    }
    toast.success(`Invites sent via ${inviteMethods.join(', ')} to ${invitedUsers.length} user(s).`);
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
              <option key={cat} value={cat}>{cat}</option>
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
          {mockTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mockTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
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
                  invitedUsers.some((u) => u.id === user.id) ? 'bg-yellow-50 border-yellow-400' : 'border-gray-200'
                }`}
              >
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email} · {user.phone}</div>
                </div>
                <input type="checkbox" readOnly checked={invitedUsers.some((u) => u.id === user.id)} />
              </div>
            ))}
          </div>

          {invitedUsers.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-4 items-center">
                <label className="text-sm font-medium">Send via:</label>
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
