import { useState } from "react";
import styles from "./GroupSettingsForm.module.scss";

export default function GroupSettingsForm({ initialSettings = {}, onSave }) {
  const [name, setName] = useState(initialSettings.name || '');
  const [description, setDescription] = useState(initialSettings.description || '');
  const [tags, setTags] = useState((initialSettings.tags || []).join(', '));
  const [isPublic, setIsPublic] = useState(initialSettings.isPublic ?? true);

  const handleSave = () => {
    const settings = {
      name: name.trim(),
      description: description.trim(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      isPublic,
    };
    onSave?.(settings);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>⚙️ Edit Group Settings</h3>

      <div className={styles.field}>
        <label className={styles.label}>Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Tags (comma separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.checkboxRow}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Public Group
        </label>
      </div>

      <button
        onClick={handleSave}
        className={styles.saveButton}
        type="button"
      >
        Save Changes
      </button>
    </div>
  );
}
