import "@/components/homepage/IndexPage.css";
import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import MarqueeSection from "@/components/homepage/MarqueeSection";
import AboutSection from "@/components/homepage/AboutSection";
import PortalsSection from "@/components/homepage/PortalsSection";
import QRSection from "@/components/homepage/QRSection";
import WorkflowSection from "@/components/homepage/WorkflowSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import ChallengesSection from "@/components/homepage/ChallengesSection";
import CTASection from "@/components/homepage/CTASection";
import FooterSection from "@/components/homepage/FooterSection";

const Index = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <PortalsSection />
      <QRSection />
      <WorkflowSection />
      <FeaturesSection />
      <ChallengesSection />
      <CTASection />
      <FooterSection />
    </>
  );
};

export default Index;
