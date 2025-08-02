export default function LibraryItem({ item }) {
  return (
    <div className="flex items-center justify-between border-b py-2">
      <div>
        <h4 className="font-medium">{item.title}</h4>
        {item.price_paid && (
          <p className="text-sm text-gray-600">{`$${item.price_paid}`}</p>
        )}
      </div>
      <a
        href={`/api/library/download/${item.id}`}
        className="text-blue-600 underline"
      >
        Download
      </a>
    </div>
  );
}
