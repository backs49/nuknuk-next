import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import HeroSection from "@/components/HeroSection";
import MenuSection from "@/components/MenuSection";
import AboutSection from "@/components/AboutSection";
import LocationSection from "@/components/LocationSection";
import InstagramFeed from "@/components/InstagramFeed";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { getMenuItems, getCategories } from "@/lib/menu-db";
import FAQSection from "@/components/FAQSection";
import { FAQ_ENABLED } from "@/lib/feature-flags";

export const revalidate = 60; // 60초마다 메뉴 데이터 재검증

export default async function Home() {
  const [menuItems, categoryList] = await Promise.all([
    getMenuItems(),
    getCategories(),
  ]);

  return (
    <>
      <AnnouncementBanner />
      <Header />
      <main>
        <HeroSection />
        <MenuSection items={menuItems} categories={categoryList} />
        <AboutSection />
        <LocationSection />
        {FAQ_ENABLED && <FAQSection />}
        <InstagramFeed />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
