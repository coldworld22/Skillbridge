# Instructor Booking Workflow

This guide outlines the end‑to‑end flow for live session bookings so that support, instructors, and students share the same expectations.

---

## 1. Roles and Responsibilities

| Role       | Key responsibilities | Primary screens |
|------------|---------------------|-----------------|
| Student    | Request, reschedule, cancel sessions; prepare after approval | `Dashboard → Student → My Bookings`, `Messages` |
| Instructor | Review requests, negotiate timing, approve/decline/cancel, mark sessions complete | `Dashboard → Instructor → Bookings`, `Messages`, `Availability` |
| Admin      | Monitor volume/status, investigate edge cases (no direct intervention required) | `Dashboard → Admin → Bookings` |

---

## 2. Status Lifecycle

```
pending → approved → completed
        ↘ declined
        ↘ cancelled
```

- **pending** – student has submitted (or resubmitted) a time slot; instructor decision is required.
- **approved** – instructor confirmed the time; both parties prepare for the session.
- **completed** – instructor has delivered the session and marked it done.
- **declined** – instructor declined the request (optional reason captured in notes).
- **cancelled** – student or instructor cancelled after a request was made.

All status transitions are persisted in `bookings.status` and reflected immediately on student, instructor, and admin dashboards.

---

## 3. Detailed Flow

1. **Student requests a booking**
   - Path: Instructor profile → “Request Booking”.
   - Required inputs: desired start time, duration (defaults to 60 minutes), session notes.
   - System stores request as `pending`; student sees it under **Pending** in `My Bookings`.

2. **Negotiation (optional)**
   - Channel: in‑app `Messages`.
   - Student can reschedule from `My Bookings` → “Reschedule”, which updates start/end times and resets status to `pending`.
   - Instructor can reply via messages or leave decision notes when approving/declining.

3. **Instructor decision**
   - Path: `Dashboard → Instructor → Bookings`.
   - Actions:
     - **Approve Booking** → status becomes `approved`.
     - **Decline Request** → status becomes `declined`; optional note shared with the student.
     - **Cancel Booking** → status becomes `cancelled` (available for both `pending` and `approved` sessions).

4. **Preparation window**
   - Once approved, student and instructor coordinate logistics (e.g., meeting link) via Messages or external tools.
   - Student may still reschedule or cancel before the start time if necessary.

5. **Session delivery**
   - Session occurs off-platform (Zoom, Meet, etc.).

6. **Completion**
   - Instructor reopens the booking modal and clicks **Mark as Completed**.
   - Status becomes `completed` and moves into “Completed” metrics across dashboards.

7. **Post-session follow-up (optional)**
   - Future enhancements can plug in surveys, payments, or automated reminders; the status flow already supports them.

---

## 4. UI Touchpoints by Role

### Student
- `Dashboard → Student → My Bookings`
  - Tabs for `All`, `Pending`, `Approved`, `Completed`, `Cancelled`, `Declined`.
  - Actions: Reschedule (while pending/approved), Cancel, Delete (for cancelled/declined/completed records).
- `Messages`
  - Direct messaging with instructor for clarification or negotiation.

### Instructor
- `Dashboard → Instructor → Availability`
  - Publish/revise availability slots that appear in the student booking modal.
- `Dashboard → Instructor → Bookings`
  - Filter/search cards + detail modal with actions (Approve, Decline, Cancel, Mark as Completed).
- `Messages`
  - Central channel for conversation and sharing meeting links.

### Admin
- `Dashboard → Admin → Bookings`
  - Read-only overview with filters, stats, and the same detail modal (without state-changing actions).

---

## 5. Notifications & Messaging

> Current behaviour: toasts are shown in-app for the actor performing an action; email/SMS notifications are not yet wired. If you introduce notifications later, trigger them on the API endpoints that update booking status (`PATCH /bookings/instructor/:id`, `PATCH /bookings/student/:id`).

Recommended touchpoints:
- Student receives a message/toast when instructor approves, declines, cancels.
- Instructor receives a message/toast when student reschedules or cancels.
- Admin may receive digest reports (future enhancement).

---

## 6. Data Points Captured

| Field                     | Description |
|---------------------------|-------------|
| `start_time`, `end_time`  | ISO timestamps (UTC) for the session window. |
| `notes`                   | Student-supplied notes; instructors may append notes when changing status. |
| `status`                  | Booking lifecycle value described above. |
| `student_id`, `instructor_id` | Link to `users` table for avatar/name display. |
| `requested_at`            | When the booking was first created (ordered descending in listings). |

---

## 7. Support Playbook

1. **Student asks “why is my booking still pending?”**  
   → Confirm instructor has seen it; remind them to approve or message the student for a new time.

2. **Instructor wants to change the time after approval**  
   → Ask the student to reschedule; the request will go back to pending, allowing re-approval.

3. **Session finished but still shows approved**  
   → Instruct the instructor to open the booking modal and tap “Mark as Completed”.

4. **Cancelled by mistake**  
   → Create a new booking; cancellations are soft-deleted from metrics but retained for auditing.

5. **Need evidence for a dispute**  
   → Cross-check `bookings` table (notes, timestamps) and conversation history in `messages`.

---

## 8. Future Considerations

- Automated reminders (email/SMS) before session start.
- Payment capture or invoicing tied to status transitions.
- Student feedback form triggered after completion.
- Calendar export or ICS attachments once approved.

Keep this guide updated as the product evolves so the booking department always has the latest process.

