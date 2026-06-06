import Navbar from "@/components/homepage/Navbar";
import FooterSection from "@/components/homepage/FooterSection";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, HelpCircle, Shield } from "lucide-react";

const Support = () => {
  const contactCards = [
    {
      icon: Mail,
      title: "Email Support",
      details: "support@vidyaplus.org",
      sub: "General questions and support queries",
      action: "mailto:support@vidyaplus.org",
      actionLabel: "Send an Email",
    },
    {
      icon: Phone,
      title: "Helpline",
      details: "1800-425-3456",
      sub: "Toll-free helpline (Mon-Sat, 9 AM - 6 PM)",
      action: "tel:18004253456",
      actionLabel: "Call Toll-Free",
    },
    {
      icon: MapPin,
      title: "Office Address",
      details: "DSS Bhavan, Masab Tank, Hyderabad",
      sub: "",
      action: "https://maps.google.com",
      actionLabel: "Find on Map",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="font-display text-4xl font-bold text-foreground mb-3">
                Help & Support Center
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Have a question or facing an issue? Contact our technical helpdesk or browse the FAQs below.
              </p>
            </motion.div>

            {/* Contact Info Cards */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              {contactCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <card.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">{card.title}</h3>
                    <p className="text-primary font-medium mb-2">{card.details}</p>
                    {card.sub && <p className="text-sm text-muted-foreground mb-4">{card.sub}</p>}
                  </div>
                  <a
                    href={card.action}
                    target={card.action.startsWith("http") ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="text-sm text-primary font-bold hover:underline inline-flex items-center gap-1 mt-auto"
                  >
                    {card.actionLabel} →
                  </a>
                </motion.div>
              ))}
            </div>

            {/* FAQ & Support Section */}
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="font-display font-semibold text-2xl text-foreground mb-6 text-center">Frequently Asked Questions</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                      <h4 className="font-semibold text-base text-foreground mb-2 inline-flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                        How do I download student QR Cards?
                      </h4>
                      <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                        Principals and Teachers can generate and print QR Cards from the Administration panel under "Student Registration" or the "ID Cards Generator".
                      </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                      <h4 className="font-semibold text-base text-foreground mb-2 inline-flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                        My QR scanner is not working.
                      </h4>
                      <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                        Make sure the browser has camera permission enabled. Hold the student's QR card flat and steady under bright lighting.
                      </p>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                      <h4 className="font-semibold text-base text-foreground mb-2 inline-flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                        Can I reset my password?
                      </h4>
                      <p className="text-sm text-muted-foreground pl-7 leading-relaxed">
                        If you have forgotten your password, please contact your school administrator or use the official helpline to request a reset.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
                      <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-base text-foreground mb-1">Administrative Support</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          For institutional dashboard setup, syllabus modification, or official onboarding requests, please contact the Directorate Helpdesk directly using our helpline or email.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </main>
      </div>
      <FooterSection />
    </div>
  );
};

export default Support;
