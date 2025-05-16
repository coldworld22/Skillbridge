export default function SettingsPanel({ settings, onToggle }) {
  return (
    <div className="space-y-4 bg-white p-4 rounded shadow">
      {settings.map((setting, i) => (
        <div key={i} className="flex justify-between items-center">
          <span>{setting.label}</span>
          <input
            type="checkbox"
            checked={setting.enabled}
            onChange={() => onToggle(setting.key)}
            className="scale-125"
          />
        </div>
      ))}
    </div>
  );
}
