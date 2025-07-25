# Admin Edit Class Workflow

This document explains how class editing works in SkillBridge for administrators.

## Frontend

* **Page**: `frontend/src/pages/dashboard/admin/online-classes/edit/[id].js`
* When the page mounts it fetches class details using `fetchAdminClassById` and pre-fills the form.
* On submit it calls `updateAdminClass` to send an update request to the backend.
* Success and error messages are displayed using `react-toastify` with translations from `dashboard.json`.
* After a successful update the notifications and messages stores are refreshed so any new alerts appear immediately for both the instructor and the admin.

## Backend

* **Controller**: `backend/src/modules/classes/class.controller.js` → `updateClass`
* Updates class data, handles slug changes and file replacement.
* If an admin performs the update and the class belongs to a different instructor:
  * A `class_updated` notification is sent to the instructor.
  * Every admin receives a notification and a message describing who updated the class.
  * The instructor receives a direct message from the first admin in the list.
* All operations are awaited with `Promise.all` to ensure each notification and message is created before the response is sent.

