import CartContent from "./CartContent";

export const metadata = {
  title: "My Cart | PRT Store",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <CartContent />;
}