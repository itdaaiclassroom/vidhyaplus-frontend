import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import AboutSection from "@/components/homepage/AboutSection";
import ChallengesSection from "@/components/homepage/ChallengesSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import WorkflowSection from "@/components/homepage/WorkflowSection";
import ImpactSection from "@/components/homepage/ImpactSection";
import BenefitsSection from "@/components/homepage/BenefitsSection";
import FooterSection from "@/components/homepage/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ChallengesSection />
      <FeaturesSection />
      <WorkflowSection />
      <ImpactSection />
      <BenefitsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
