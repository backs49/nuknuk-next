/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Unsplash placeholder 이미지 허용 (실제 사진으로 교체 시 이 설정 업데이트)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
