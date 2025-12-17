const API_URL = "/api/live-classes";

export async function getLiveClasses() {
  const res = await fetch(`${API_URL}`);
  return res.json();
}

export async function getLiveClassById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  return res.json();
}

export async function registerForLiveClass(classId, userId) {
  const res = await fetch(`${API_URL}/${classId}/register`, {
    method: "POST",
    body: JSON.stringify({ userId }),
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
