import OrdersContent from "./OrdersContent";

export const metadata = {
  title: "My Orders & History | PRT Store",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return <OrdersContent />;
}


