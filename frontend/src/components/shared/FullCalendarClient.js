import { forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";

const FullCalendarClient = forwardRef(function FullCalendarClient(props, ref) {
  return <FullCalendar ref={ref} {...props} />;
});

export default FullCalendarClient;
