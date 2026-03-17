import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MenuSection from "@/components/MenuSection";
import AboutSection from "@/components/AboutSection";
import LocationSection from "@/components/LocationSection";
import InstagramFeed from "@/components/InstagramFeed";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ReservationProvider from "@/components/ReservationProvider";

export default function Home() {
  return (
    <ReservationProvider>
      <Header />
      <main>
        <HeroSection />
        <MenuSection />
        <AboutSection />
        <LocationSection />
        <InstagramFeed />
        <CTASection />
      </main>
      <Footer />
    </ReservationProvider>
  );
}
