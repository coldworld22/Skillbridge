import { useEffect, useState } from "react";
import { fetchLibrary } from "@/services/libraryService";
import LibraryItem from "@/components/books/LibraryItem";

export default function LibraryPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLibrary();
        setItems(data);
      } catch (e) {
        console.error("Failed to load library", e);
      }
    };
    load();
  }, []);

  return (
    <div>
      {items.map((item) => (
        <LibraryItem key={item.id} item={item} />
      ))}
    </div>
  );
}
