import { useState } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaCreditCard, FaMoneyBillWave, FaWallet, FaEthereum } from "react-icons/fa";

const plans = [
  {
    id: 1,
    name: "Basic Plan",
    price: "$10/month",
    features: [
      "Access to selected free tutorials",
      "Browse community questions",
      "View public offers",
      "Community forum read-only access"
    ]
  },
  {
    id: 2,
    name: "Regular Plan",
    price: "$20/month",
    features: [
      "Full course access",
      "Post & reply in community",
      "Message instructors",
      "Completion certificates",
      "Preview live classes",
      "Apply for student offers"
    ]
  },
  {
    id: 3,
    name: "Premium Plan",
    price: "$30/month",
    features: [
      "Everything in Regular Plan",
      "Join live class sessions",
      "Book 1-on-1 sessions",
      "Full AI Tutor access",
      "Priority support & feedback",
      "Earn NFT certification",
      "Post & respond to premium offers"
    ],
    popular: true
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
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">Choose the Right Plan for Your Learning Journey 🚀</h2>
        <p className="text-lg text-gray-300 mb-10">
          Unlock powerful features like live classes, 1-on-1 instructor access, AI tutoring, and certification – all tailored to your plan.

        </p>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {plans.map((plan, index) => {
            const isPremium = plan.name === "Premium Plan";
            const isMiddle = index === 1;

            return (
              <motion.div
                key={plan.id}
                className={`p-6 rounded-lg shadow-2xl transition-all duration-300 ${isPremium ? "bg-yellow-500 text-gray-900 border-4 border-yellow-300" : "bg-gray-800 text-white"} ${isMiddle ? "md:scale-105 md:shadow-yellow-400" : ""} relative`}
                whileHover={{ scale: 1.08 }}
              >
                {/* Glow Effect for Premium */}
                {isPremium && (
                  <div className="absolute -top-4 right-4 bg-white text-yellow-500 font-bold px-3 py-1 rounded-full text-xs shadow-md animate-pulse z-20">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-extrabold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">{plan.price}</p>

                <ul className={`space-y-2 ${isPremium ? "text-gray-800" : "text-gray-300"}`}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center gap-2">
                      <FaCheck className="text-green-400" /> {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-6 px-6 py-3 rounded-lg font-semibold transition
            ${isPremium ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-yellow-500 text-gray-900 hover:bg-yellow-600"}
          `}
                  onClick={() => setSelectedPlan(plan)}
                >
                  Select Plan
                </button>
              </motion.div>
            );
          })}
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
