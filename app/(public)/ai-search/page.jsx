import AISearchContent from "./AISearchContent";

export const metadata = {
  title: "AI Assistant Search | PRT Store",
  description: "Ask our AI to find the best product for you.",
  robots: {
    index: false, // หน้า Search ภายในไม่ควรทำ Index เพื่อป้องกัน Duplicate Content
    follow: false,
  },
};

export default function AISearchPage() {
  return <AISearchContent />;
}