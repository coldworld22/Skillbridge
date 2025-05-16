import Link from "next/link";

const BackButton = () => (
  <Link href="/tutorials" passHref>
    <span className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-full transition cursor-pointer">
      ← Back to Tutorials
    </span>
  </Link>
);

export default BackButton;
