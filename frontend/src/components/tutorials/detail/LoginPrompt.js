import { useRouter } from "next/router";

const LoginPrompt = () => {
  const router = useRouter();
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-xl">🚫 Please log in to view this tutorial.</p>
      <button
        onClick={() => router.push("/auth/login")}
        className="bg-yellow-500 text-black px-6 py-2 rounded-full hover:bg-yellow-600"
      >
        Login Now
      </button>
    </div>
  );
};

export default LoginPrompt;
