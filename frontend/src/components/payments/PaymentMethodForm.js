export default function PaymentMethodForm() {
  return (
    <form className="space-y-4 bg-white p-6 rounded-xl shadow">
      <label className="block">
        <span className="text-sm">Cardholder Name</span>
        <input type="text" className="w-full border rounded p-2" />
      </label>
      <label className="block">
        <span className="text-sm">Card Number</span>
        <input type="text" className="w-full border rounded p-2" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className="text-sm">Expiry</span>
          <input type="text" placeholder="MM/YY" className="w-full border rounded p-2" />
        </label>
        <label>
          <span className="text-sm">CVC</span>
          <input type="text" className="w-full border rounded p-2" />
        </label>
      </div>
      <button className="bg-yellow-400 px-6 py-2 rounded-full text-white">Save Method</button>
    </form>
  );
}
