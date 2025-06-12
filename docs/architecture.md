# Backend Architecture Overview

This project uses a modular Express.js structure. Each user role (Admin, Instructor and Student) has its own set of controllers and routes under `src/modules/users`. Tutorials and their related resources live under `src/modules/users/tutorials`.

Uploaded tutorial assets are stored in role specific folders:

```
backend/uploads/tutorials/admin/
backend/uploads/tutorials/instructor/
backend/uploads/tutorials/student/
```

The upload middleware automatically places files in these folders based on the authenticated user's role.
