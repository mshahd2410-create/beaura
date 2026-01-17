import Header from "./components/Header";
import Hero from "./components/Hero";
import WhyUs from "./components/WhyUs";
import HowItWorks from "./components/HowItWorks";
import Guarantee from "./components/Guarantee";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1f1f1f]">
      <Header />
      <Hero />
      <WhyUs />
      <HowItWorks />
      <Guarantee />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
