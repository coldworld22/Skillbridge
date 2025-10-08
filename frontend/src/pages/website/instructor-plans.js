import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import SubscriptionPlans from "@/components/website/sections/SubscriptionPlans";

export default function InstructorPlansPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <SubscriptionPlans role="instructor" />
      <Footer />
    </div>
  );
}

