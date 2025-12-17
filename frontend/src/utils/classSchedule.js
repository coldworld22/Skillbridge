export const computeScheduleStatus = (startDate, endDate) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && now < start) return "Upcoming";
  if (start && end && now >= start && now <= end) return "Ongoing";
  if (end && now > end) return "Completed";
  return "Upcoming";
};

export default computeScheduleStatus;
