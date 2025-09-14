import { FaEye, FaUsers, FaStar, FaRegComments, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';

export default function TutorialCard({ tutorial, onView, onEdit, onChecklist, onSubmit, onDelete }) {
  const { t } = useTranslation(['dashboard', 'tutorials']);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl border border-gray-100">
      <div className="relative">
        <img
          src={tutorial.thumbnail || '/default-thumbnail.jpg'}
          alt={tutorial.title}
          className="h-48 w-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              tutorial.status === 'Approved'
                ? 'bg-green-100 text-green-800'
                : tutorial.status === 'Pending'
                ? 'bg-blue-100 text-blue-800'
                : tutorial.status === 'Draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {t(`dashboard:tutorialsPage.status_label.${tutorial.status.toLowerCase()}`)}
          </span>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold text-gray-800 line-clamp-2">{tutorial.title}</h2>
            <span className="font-bold text-indigo-700 whitespace-nowrap ml-2">
              {tutorial.price ? `$${tutorial.price}` : t('tutorials:list.free')}
            </span>
          </div>

          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span className="mr-3">{new Date(tutorial.updatedAt).toLocaleDateString()}</span>
            <div className="h-1 w-1 bg-gray-400 rounded-full mr-3"></div>
            <span>{tutorial.language || t('dashboard:tutorialsPage.default_language')}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs">
              {tutorial.category_name || t('dashboard:tutorialsPage.category_general')}
            </span>
            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs">
              {tutorial.level || t('dashboard:tutorialsPage.all_levels')}
            </span>
          </div>

          {tutorial.tags && tutorial.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tutorial.tags.map((tag) => (
                <span key={tag.id || tag} className="bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-700">
                  {tag.name || tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FaEye className="mx-auto text-blue-500" />
              <span className="text-xs mt-1">{tutorial.views}</span>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <FaUsers className="mx-auto text-green-500" />
              <span className="text-xs mt-1">{tutorial.enrollments}</span>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <FaStar className="mx-auto text-yellow-500" />
              <span className="text-xs mt-1">{tutorial.rating}</span>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaRegComments className="mx-auto text-purple-500" />
              <span className="text-xs mt-1">{tutorial.comments}</span>
            </div>
          </div>

          {tutorial.status === 'Draft' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{t('dashboard:tutorialsPage.progress')}</span>
                <span>{tutorial.progress || 40}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                  style={{ width: `${tutorial.progress || 40}%` }}
                ></div>
              </div>
            </div>
          )}

          {tutorial.status === 'Pending' && (
            <div className="mt-4 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-2 rounded-lg">
              ⏳ {t('dashboard:tutorialsPage.pending_approval')}
            </div>
          )}
          {tutorial.status === 'Rejected' && tutorial.rejection_reason && (
            <div className="mt-4 bg-red-50 text-red-700 text-xs font-medium px-3 py-2 rounded-lg">
              ❌ {tutorial.rejection_reason}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onView} className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors">
            <FaEye className="mr-2" /> {t('dashboard:tutorialsPage.view')}
          </button>

          {(tutorial.status === 'Draft' || tutorial.status === 'Rejected') && (
            <button onClick={onEdit} className="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors">
              <FaEdit className="mr-2" /> {t('dashboard:tutorialsPage.edit')}
            </button>
          )}

          <button onClick={onChecklist} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors">
            <span className="mr-2">📋</span> {t('dashboard:tutorialsPage.checklist')}
          </button>

          {tutorial.status === 'Draft' && tutorial.progress === 100 && (
            <button onClick={onSubmit} className="bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors">
              {t('dashboard:tutorialsPage.submit')}
            </button>
          )}

          {(tutorial.status === 'Draft' || tutorial.status === 'Rejected') && (
            <button onClick={onDelete} className="bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors">
              <FaTrash className="mr-2" /> {t('dashboard:tutorialsPage.delete')}
            </button>
          )}

          <button
            onClick={() => {
              const dataStr =
                'data:text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(tutorial, null, 2));
              const a = document.createElement('a');
              a.href = dataStr;
              a.download = `${tutorial.slug || tutorial.id}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
          >
            <FaDownload className="mr-2" /> {t('dashboard:tutorialsPage.export')}
          </button>
        </div>
      </div>
    </div>
  );
}

