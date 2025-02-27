import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";

const ConfirmationPage = () => {
  return (
    <div className="bg-black min-h-screen text-white flex flex-col justify-center items-center">
      <FaCheckCircle className="text-6xl text-green-500 mb-4" />
      <h1 className="text-3xl font-bold mb-4">✅ Order Confirmed!</h1>
      <p className="text-lg text-gray-400">Thank you for your purchase. A confirmation email has been sent.</p>
      <Link href="/">
        <button className="mt-6 px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition">
          Return to Home
        </button>
      </Link>
    </div>
  );
};

export default ConfirmationPage;
