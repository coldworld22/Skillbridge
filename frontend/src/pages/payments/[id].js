// pages/payments/checkout.js
import { useState } from "react";
import { ethers } from "ethers";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    zip: "",
    address: "",
    coupon: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [ethStatus, setEthStatus] = useState("");
  const [account, setAccount] = useState(null);

  const coursePrice = 49;
  const discountCode = "SKILL10";
  const finalTotal = coursePrice - appliedDiscount;
  const ethPrice = 0.01; // mock ETH equivalent

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyCoupon = () => {
    if (formData.coupon.trim().toUpperCase() === discountCode) {
      setAppliedDiscount(10);
    } else {
      alert("Invalid coupon code");
      setAppliedDiscount(0);
    }
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email) {
      alert("Please fill out all required fields.");
      return;
    }
  
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert("✅ Payment successful! Redirecting...");
      router.push("/payments/success");
    }, 1500);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask.");
    }
  };

  const handleMetaMaskPayment = async () => {
    try {
      setEthStatus("🔄 Sending transaction...");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: "0xYourWalletAddressHere", // your wallet
        value: ethers.utils.parseEther(ethPrice.toString()),
      });
      await tx.wait();
      setEthStatus("✅ ETH Payment successful!");
      setTimeout(() => {
        router.push("/payments/success");
      }, 1500);
    } catch (err) {
      console.error(err);
      setEthStatus("❌ ETH Payment failed.");
    }
  };
  

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16 mt-16 space-y-10">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">🧾 Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Section: Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">🧍 User Information</h2>
            <div className="space-y-4">
              <input name="fullName" placeholder="Full Name" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />
              <input name="email" placeholder="Email" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />
              <input name="phone" placeholder="Phone Number" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />

              <h2 className="text-xl font-semibold mt-6 mb-4">🏠 Billing Address</h2>
              <input name="country" placeholder="Country" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />
              <input name="city" placeholder="City" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />
              <input name="zip" placeholder="ZIP Code" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />
              <input name="address" placeholder="Full Address" onChange={handleChange} className="w-full px-4 py-2 bg-gray-800 rounded" />

              <h2 className="text-xl font-semibold mt-6 mb-4">🏷️ Coupon</h2>
              <div className="flex gap-2">
                <input name="coupon" placeholder="Enter coupon code" onChange={handleChange} className="flex-grow px-4 py-2 bg-gray-800 rounded" />
                <button onClick={applyCoupon} className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-300">
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Right Section: Summary */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">📘 Course Summary</h2>
            <div className="mb-6">
              <p className="font-bold text-lg">Mastering React.js</p>
              <p className="text-sm text-gray-400">Instructor: John Doe</p>
              <p className="text-sm text-gray-400 mt-1">Date: April 2025</p>
              <p className="text-yellow-400 font-semibold mt-2">${coursePrice}</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">💳 Payment Methods</h2>
            <div className="space-y-3 mb-6">
              <button onClick={handleSubmit} className="w-full bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white">
                Pay with Stripe
              </button>
              <button onClick={handleSubmit} className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-black">
                Pay with PayPal
              </button>
              {!account ? (
                <button onClick={connectWallet} className="w-full bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded text-white">
                  Connect MetaMask
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMetaMaskPayment}
                    className="w-full bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white"
                  >
                    Pay with ETH (0.01)
                  </button>
                  <p className="text-sm text-gray-300 mt-2">Wallet: {account}</p>
                  <p className="text-sm mt-1">{ethStatus}</p>
                </>
              )}
            </div>

            <h2 className="text-xl font-semibold mb-4">🧾 Order Summary</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Subtotal: ${coursePrice}</p>
              <p>Discount: -${appliedDiscount}</p>
              <hr className="border-gray-600 my-2" />
              <p className="text-white font-bold text-lg">Total: ${finalTotal}</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full mt-6 py-3 rounded text-black font-semibold transition ${
                isProcessing ? "bg-yellow-300 cursor-wait" : "bg-yellow-400 hover:bg-yellow-300"
              }`}
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
