import Navbar from "@/components/website/sections/Navbar";

const OrdersPage = () => {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">📦 Order History</h1>
        <p>View your past purchases and transactions.</p>
      </main>
    </div>
  );
};

export default OrdersPage;
