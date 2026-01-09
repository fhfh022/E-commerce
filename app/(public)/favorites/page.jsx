import FavoritesContent from "./FavoritesContent";

export const metadata = {
  title: "My Wishlist | PRT Store",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesPage() {
  return <FavoritesContent />;
}