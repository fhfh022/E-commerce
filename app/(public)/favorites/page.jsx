import FavoritesContent from "./FavoritesContent";

export const metadata = {
  title: "My Favorites | PRT Store",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesPage() {
  return <FavoritesContent />;
}