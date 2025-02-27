import { useState } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaCreditCard, FaMoneyBillWave, FaWallet, FaEthereum } from "react-icons/fa";

const plans = [
  {
    id: 1,
    name: "Basic Plan",
    price: "$10/month",
    features: ["Access to Free Courses", "Community Forums", "No Certificate"],
    popular: false
  },
  {
    id: 2,
    name: "Pro Plan",
    price: "$30/month",
    features: ["All Courses", "Instructor Support", "Completion Certificate"],
    popular: true
  },
  {
    id: 3,
    name: "Lifetime Access",
    price: "$250 One-Time",
    features: ["All Courses & Future Content", "NFT Certificate", "Lifetime Access"],
    popular: false
  }
];

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">Choose Your Plan</h2>
        <p className="text-lg text-gray-300 mb-10">
          Get unlimited access to premium courses and expert mentorship.
        </p>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              className={`p-6 rounded-lg shadow-lg ${plan.popular ? "bg-yellow-500 text-gray-900" : "bg-gray-800"}`}
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-3xl font-semibold my-3">{plan.price}</p>
              <ul className="text-gray-300">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-center gap-2">
                    <FaCheck className="text-green-400" /> {feature}
                  </li>
                ))}
              </ul>
              <button
                className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                onClick={() => setSelectedPlan(plan)}
              >
                Select Plan
              </button>
            </motion.div>
          ))}
        </div>

        {/* Payment Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 p-6 rounded-lg text-white shadow-xl max-w-lg text-center"
            >
              <h3 className="text-xl font-bold mb-4">Complete Payment for {selectedPlan.name}</h3>
              <p className="text-gray-300">{selectedPlan.price}</p>

              {/* Payment Methods */}
              <div className="mt-4 flex flex-col gap-4">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition">
                  <FaCreditCard /> Pay with Credit Card
                </button>
                <button className="bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-600 transition">
                  <FaMoneyBillWave /> Pay with PayPal
                </button>
                <button className="bg-purple-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-600 transition">
                  <FaEthereum /> Pay with Crypto
                </button>
              </div>

              <button
                className="mt-6 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                onClick={() => setSelectedPlan(null)}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </section>
    </motion.section>



  );
};

export default SubscriptionPlans;
