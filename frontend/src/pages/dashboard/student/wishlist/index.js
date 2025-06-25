import { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { getMyClassWishlist, removeClassFromWishlist, enrollInClass } from '@/services/classService';
import { getMyTutorialWishlist, removeTutorialFromWishlist } from '@/services/tutorialService';
import { addToCart } from '@/services/cartService';
import { FaSearch, FaSortAmountDown, FaShareAlt, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function WishlistPage() {
  const [classes, setClasses] = useState([]);
  const [tutorials, setTutorials] = useState([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [tags, setTags] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getMyClassWishlist();
        const t = await getMyTutorialWishlist();
        setClasses(c);
        setTutorials(t);
        const stored = JSON.parse(localStorage.getItem('wishlistTags') || '{}');
        setTags(stored);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const removeClass = async(id) => {
    await removeClassFromWishlist(id);
    setClasses(classes.filter(c=>c.id!==id));
  };
  const removeTutorial = async(id) => {
    await removeTutorialFromWishlist(id);
    setTutorials(tutorials.filter(t=>t.id!==id));
  };

  const handleEnroll = async(cls) => {
    try { await enrollInClass(cls.id); } catch(err) { console.error(err); }
  };

  const handleAddToCart = async(item) => {
    try {
      await addToCart({ id: item.id, name: item.title, price: item.price || 0 });
      toast.success('Added to cart');
    } catch(err) {
      console.error(err);
      toast.error('Failed to add to cart');
    }
  };

  const updateTag = (id, value) => {
    const updated = { ...tags, [id]: value };
    setTags(updated);
    localStorage.setItem('wishlistTags', JSON.stringify(updated));
  };

  const shareWishlist = async () => {
    const titles = [...classes, ...tutorials].map(i => i.title).join(', ');
    const text = `My SkillBridge Wishlist: ${titles}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Wishlist copied to clipboard');
    }
  };

  const setReminder = (item) => {
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    reminders.push({ id: item.id, title: item.title, date: item.start_date });
    localStorage.setItem('reminders', JSON.stringify(reminders));
    alert('Reminder set!');
  };

  const filteredClasses = classes
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));

  const filteredTutorials = tutorials
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6 text-yellow-600">My Wishlist</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
        <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:w-1/2">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search wishlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none"
          />
        </div>
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
        >
          <FaSortAmountDown /> Sort ({sortOrder})
        </button>
        <button
          onClick={shareWishlist}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
        >
          <FaShareAlt /> Share
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-2">Classes</h2>
      {filteredClasses.length===0? <p className="text-gray-500">No classes in wishlist.</p>:
        <ul className="space-y-2">{filteredClasses.map(c=>(
          <li key={c.id} className="bg-white p-3 rounded-md shadow">
            <div className="flex justify-between items-center">
              <span className="font-medium">{c.title}</span>
              <div className="flex gap-2">
                <button onClick={()=>handleEnroll(c)} className="text-green-600 text-sm">Enroll</button>
                <button onClick={()=>handleAddToCart(c)} className="text-blue-600 text-sm">Add to Cart</button>
                <button onClick={()=>setReminder(c)} className="text-yellow-600 text-sm" title="Set Reminder"><FaBell/></button>
                <button onClick={()=>removeClass(c.id)} className="text-red-500 text-sm">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{c.start_date ? new Date(c.start_date).toLocaleDateString() : ''} {c.status && `- ${c.status}`}</p>
            <input
              type="text"
              placeholder="Add tag"
              value={tags[c.id] || ''}
              onChange={(e)=>updateTag(c.id, e.target.value)}
              className="mt-2 w-full border rounded p-1 text-sm"
            />
          </li>))}
        </ul>}
      <h2 className="text-xl font-semibold mt-6 mb-2">Tutorials</h2>
      {filteredTutorials.length===0? <p className="text-gray-500">No tutorials in wishlist.</p>:
        <ul className="space-y-2">{filteredTutorials.map(t=>(
          <li key={t.id} className="bg-white p-3 rounded-md shadow">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t.title}</span>
              <div className="flex gap-2">
                <button onClick={()=>handleAddToCart(t)} className="text-blue-600 text-sm">Add to Cart</button>
                <button onClick={()=>setReminder(t)} className="text-yellow-600 text-sm" title="Set Reminder"><FaBell/></button>
                <button onClick={()=>removeTutorial(t.id)} className="text-red-500 text-sm">Remove</button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{t.status && t.status}</p>
            <input
              type="text"
              placeholder="Add tag"
              value={tags[t.id] || ''}
              onChange={(e)=>updateTag(t.id, e.target.value)}
              className="mt-2 w-full border rounded p-1 text-sm"
            />
          </li>))}
        </ul>}
    </StudentLayout>
  );
}
