import Link from "next/link";
import { formatCurrency } from "@/utils/currency";

const EnrollBanner = ({
  onEnroll,
  isPaid,
  price,
  onAddToCart,
  checkoutUrl,
  currency = "USD",
}) => {
  const formattedPrice = isPaid
    ? formatCurrency(price, { currency })
    : "Free";

  let actionButton;
  if (isPaid) {
    if (checkoutUrl) {
      actionButton = (
        <Link
          href={checkoutUrl}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Buy Now
        </Link>
      );
    } else {
      actionButton = (
        <button
          onClick={onAddToCart}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add to Cart
        </button>
      );
    }
  } else {
    actionButton = (
      <button
        onClick={onEnroll}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        💳 Enroll Now
      </button>
    );
  }

  return (
    <div className="bg-yellow-700/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg flex items-center justify-between">
      <p>
        Enroll to unlock all chapters and quizzes.
        <span className="font-semibold ml-2">{formattedPrice}</span>
      </p>
      {actionButton}
    </div>
  );
};

export default EnrollBanner;
