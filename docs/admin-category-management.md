# Admin Category Management

Administrators can organize classes and tutorials into a hierarchical list of categories. Each category may have an optional parent so nested structures like `Programming > Web Development > JavaScript` are supported.

## Backend

- **Routes:** exposed under `/api/users/admin/categories` and implemented in `backend/src/modules/users/categories`.
- `POST /create` – create a new category. Supports uploading an image file via the `image` form field.
- `PUT /:id` – update name, parent, status or image.
- `PATCH /:id/status` – toggle between `active` and `inactive`.
- `DELETE /:id` – remove a category that has no sub‑categories.
- `GET /` – list categories with optional `search` and `status` filters.
- `GET /tree` – return categories in a nested structure for dropdowns.
- `GET /:id` – fetch a single category by id.

## Frontend

- Pages live in `frontend/src/pages/dashboard/admin/categories`.
  - `index.js` lists categories and allows status toggling or deletion.
  - `create.js` provides a form to add a new category.
  - `edit/[id].js` edits an existing category.
- Requests are handled through `frontend/src/services/admin/categoryService.js`.
- Images are previewed client‑side before upload and stored in `/uploads/categories` on the server.

See also the seed files under `backend/src/seeds` for example parent and child categories.
