import { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import { getMyClassWishlist, removeClassFromWishlist } from '@/services/classService';
import { getMyTutorialWishlist, removeTutorialFromWishlist } from '@/services/tutorialService';

export default function WishlistPage() {
  const [classes, setClasses] = useState([]);
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getMyClassWishlist();
        const t = await getMyTutorialWishlist();
        setClasses(c);setTutorials(t);
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

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6 text-yellow-600">My Wishlist</h1>
      <h2 className="text-xl font-semibold mb-2">Classes</h2>
      {classes.length===0? <p className="text-gray-500">No classes in wishlist.</p>:
        <ul className="space-y-2">{classes.map(c=>(
          <li key={c.id} className="flex justify-between bg-white p-3 rounded-md shadow">
            <span>{c.title}</span>
            <button onClick={()=>removeClass(c.id)} className="text-red-500">Remove</button>
          </li>))}
        </ul>}
      <h2 className="text-xl font-semibold mt-6 mb-2">Tutorials</h2>
      {tutorials.length===0? <p className="text-gray-500">No tutorials in wishlist.</p>:
        <ul className="space-y-2">{tutorials.map(t=>(
          <li key={t.id} className="flex justify-between bg-white p-3 rounded-md shadow">
            <span>{t.title}</span>
            <button onClick={()=>removeTutorial(t.id)} className="text-red-500">Remove</button>
          </li>))}
        </ul>}
    </StudentLayout>
  );
}
