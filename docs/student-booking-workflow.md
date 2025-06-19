# Student Booking Workflow

This guide outlines the typical steps a student follows to book a lesson on SkillBridge using the web frontend and backend API.

1. **Browse instructors**
   - From the main website, students can view instructor profiles and available classes.
   - Each class listing links to a booking form where the student selects a date and time.

2. **Create the booking**
   - After choosing a slot, the frontend sends a `POST /api/bookings/student` request with the instructor ID, `start_time` and `end_time`.
   - The backend stores the booking in a `pending` state and returns the booking details.

3. **Payment (optional)**
   - If the class requires payment, the student is redirected to the payment flow.
   - Once payment succeeds, the booking remains `pending` until the instructor responds.

4. **Instructor approval**
   - Instructors review new bookings from their dashboard and may update the status via `PATCH /api/bookings/instructor/:id` (e.g. `approved` or `declined`).

5. **View upcoming lessons**
   - Students can check their bookings using `GET /api/bookings/student`.
   - The frontend displays each booking's status so students know whether it is confirmed.

6. **Join the session**
   - At the scheduled time, the student joins the virtual classroom link provided by the instructor.

7. **After the lesson**
   - The booking status becomes `completed` once the session ends.
   - Students may leave feedback or schedule another lesson.

Refer to the [Booking API](../README.md#booking-api) section for endpoint details.
