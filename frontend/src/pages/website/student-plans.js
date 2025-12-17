import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import SubscriptionPlans from "@/components/website/sections/SubscriptionPlans";
import PlanFeatureMatrix from "@/components/website/sections/PlanFeatureMatrix";
import styles from "./website.module.scss";

export default function StudentPlansPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <SubscriptionPlans role="student" />
      <PlanFeatureMatrix role="student" />
      <Footer />
    </div>
  );
}
