import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import MonitoringSection from "@/components/MonitoringSection";
import SecuritySection from "@/components/SecuritySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <MonitoringSection />
      <SecuritySection />
      <Footer />
    </div>
  );
};

export default Index;
