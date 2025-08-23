import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import StudentLayout from '@/components/layouts/StudentLayout';
import { getMyTutorialFavorites, removeTutorialFromFavorites } from '@/services/tutorialService';
import nextI18NextConfig from '../../../../../next-i18next.config.js';

export default function TutorialFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const { t } = useTranslation('tutorials');
  const tr = (key, def) => {
    const res = t(key);
    return res === key ? def : res;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const items = await getMyTutorialFavorites();
        setFavorites(items);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const removeFavorite = async (id) => {
    try {
      await removeTutorialFromFavorites(id);
      setFavorites(favorites.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-6">{tr('favoritesPage.heading', 'My Favorite Tutorials')}</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">{tr('favoritesPage.empty', 'You have no favorite tutorials.')}</p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((tutorial) => (
            <li key={tutorial.id} className="bg-white p-3 rounded-md shadow flex justify-between items-center">
              <span className="font-medium">{tutorial.title}</span>
              <button
                onClick={() => removeFavorite(tutorial.id)}
                className="text-red-500 text-sm"
              >
                {tr('favoritesPage.remove', 'Remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </StudentLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['tutorials'], nextI18NextConfig)),
    },
  };
}
