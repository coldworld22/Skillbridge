export const STORAGE_KEY = "sb-certificate-templates";

const read = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse templates", err);
    return [];
  }
};

const write = (templates) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const getTemplates = () => read();

export const getTemplate = (id) => read().find((t) => t.id === id);

export const saveTemplate = (template) => {
  const templates = read();
  const newTemplate = { ...template, id: template.id || Date.now().toString(), active: true };
  templates.push(newTemplate);
  write(templates);
  return newTemplate;
};

export const updateTemplate = (id, data) => {
  const templates = read();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx !== -1) {
    templates[idx] = { ...templates[idx], ...data };
    write(templates);
    return templates[idx];
  }
  return null;
};

export const deleteTemplate = (id) => {
  const filtered = read().filter((t) => t.id !== id);
  write(filtered);
};

export const toggleTemplateStatus = (id) => {
  const templates = read();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx !== -1) {
    templates[idx].active = !templates[idx].active;
    write(templates);
    return templates[idx];
  }
  return null;
};
