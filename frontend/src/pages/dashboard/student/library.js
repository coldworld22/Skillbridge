import { useEffect } from "react";
import LibraryItem from "@/components/books/LibraryItem";
import useLibraryStore from "@/store/libraryStore";

export default function LibraryPage() {
  const { books, fetchLibrary } = useLibraryStore();

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <div>
      {books.map((item) => (
        <LibraryItem key={item.id} item={item} />
      ))}
    </div>
  );
}
