import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WhyBeaura from "@/components/landing/WhyBeaura";
import HowItWorks from "@/components/landing/HowItWorks";
import Guarantee from "@/components/landing/Guarantee";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <WhyBeaura />
        <HowItWorks />
        <Guarantee />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}