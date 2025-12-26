/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev', // ✅ เพิ่มโดเมนนี้
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // ✅ สำหรับรูปจาก Google
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'likutzdumypvfkbwsykk.supabase.co', // ✅ สำหรับ Supabase Storage
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
//
export default nextConfig;
