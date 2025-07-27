const options = ['Low', 'Medium', 'High', 'Urgent'];

export default function PrioritySelector({ value, onChange }) {
  return (
    <select
      className="border rounded px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
