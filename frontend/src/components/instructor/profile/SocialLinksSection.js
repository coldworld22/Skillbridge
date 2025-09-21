import { allowedPlatforms, defaultPlatformIcon } from "@/utils/socialPlatforms";

export default function SocialLinksSection({ socialLinks, onChange, t }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{t('social_links')}</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allowedPlatforms.map(({ name, Icon, className }) => {
          const IconComponent = Icon || defaultPlatformIcon.Icon;
          if (!IconComponent) {
            return null;
          }
          const iconClassName = className || defaultPlatformIcon.className;

          return (
            <div key={name} className="bg-gray-50 p-3 rounded-lg">
              <label className="text-sm flex items-center gap-2 font-medium mb-1">
                <IconComponent className={iconClassName} />
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </label>
              <input
                type="text"
                name={name}
                value={socialLinks[name] || ""}
                onChange={(e) => onChange({ ...socialLinks, [name]: e.target.value })}
                placeholder={`https://${name}.com/yourprofile`}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
