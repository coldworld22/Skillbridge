# Book Marketplace Module Workflow

## Module Goal
Allow instructors to upload and sell PDF books, and allow students to browse, purchase, and download them. Admin approves books, tracks sales, and configures settings.

## Database Schema
### books
- `id`
- `title`
- `short_description`
- `detailed_description`
- `price` (decimal)
- `pdf_url`
- `cover_image_url`
- `category_id` (FK → categories)
- `language`
- `license_type`
- `allow_preview`
- `preview_pages`
- `instructor_id` (FK → users)
- `status` (pending, approved, rejected)
- `created_at`

### book_purchases
- `id`
- `student_id` (FK → users)
- `book_id` (FK → books)
- `price_paid`
- `purchased_at`

### book_categories (optional)
- `id`
- `name`
- `slug`
- `status`

## Route Map (Frontend)
### Public
- `/marketplace/books` → Browse books
- `/marketplace/books/[id]` → Book details

### Student
- `/cart` → View cart
- `/payments/checkout` → Pay for books
- `/dashboard/student/library` → Purchased books list (download access)

### Instructor
- `/dashboard/instructor/books` → Book list (own)
- `/dashboard/instructor/books/create` → Add new book
- `/dashboard/instructor/books/[id]/edit` → Edit book
- `/dashboard/instructor/books/analytics` → Sales overview

### Admin
- `/dashboard/admin/books` → View all books
- `/dashboard/admin/books/pending` → Approve/reject
- `/dashboard/admin/settings/books` → Commission %, file rules
- `/dashboard/admin/books/analytics` → Sales statistics

## API Endpoints (Backend)
### Instructor
- `POST /api/books` → Create new book
- `PUT /api/books/:id` → Update book
- `GET /api/instructor/books` → List instructor's books
- `GET /api/instructor/books/analytics` → View sales

### Student
- `GET /api/books` → Public book list
- `GET /api/books/:id` → Book details
- `POST /api/cart` → Add to cart
- `POST /api/checkout` → Process purchase
- `GET /api/library` → List purchased books
- `GET /api/library/download/:bookId` → Download secure PDF

### Admin
- `GET /api/admin/books/pending` → Pending list
- `PATCH /api/admin/books/:id/approve` → Approve book
- `PATCH /api/admin/books/:id/reject` → Reject book
- `GET /api/admin/books/analytics` → View stats

## Components
- `<BookCard />` – Title, price, instructor, thumbnail
- `<BookForm />` – Form to create/edit book
- `<BookDetails />` – Full view + “Add to Cart” button
- `<CartItem />` – Book row in cart with quantity controls
- `<LibraryItem />` – Book row in student library
- `<SecureDownload />` – Button for PDF access (with auth token check)
- `<AdminBookRow />` – Approve/reject actions

## Permission Flow
| Action | Role |
|---|---|
| Upload book | Instructor only |
| Approve/reject | Admin only |
| Purchase book | Student only |
| View library | Student only |
| Download book | Student only (if purchased) and plan feature `books_download` enabled |
| View earnings | Instructor |
| Manage commission/settings | Admin |

## Payment & Access Flow
1. Student adds book to cart
2. Proceeds to checkout
3. After successful payment:
   - `book_purchases` entry is created
   - PDF is added to My Library
   - Student can access book via secure download route

## Notifications (optional enhancements)
- Instructor notified when book is approved
- Instructor notified on each new sale
- Admin notified on new book submission
- Student gets confirmation email after purchase

## Admin Configuration
- Commission percentage (20% default)
- Max PDF size (e.g., 50MB)
- Toggle book module on/off
- Book categories manager (optional)

