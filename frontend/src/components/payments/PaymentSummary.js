// components/payments/PaymentSummary.js
export default function PaymentSummary() {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Premium Plan</span>
            <span>$49.99</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>- $10.00</span>
          </div>
          <hr />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>$39.99</span>
          </div>
        </div>
      </div>
    );
  }
  