import { SignInButton, useAuth, useUser } from "@clerk/react";
import { trpc } from "@/lib/trpc";

export default function Account() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const orders = trpc.orders.myOrders.useQuery(undefined, { enabled: Boolean(isSignedIn) });

  if (!isLoaded) return <main className="account-page"><p>جارٍ تحميل الحساب...</p></main>;
  if (!isSignedIn) return <main className="account-page"><h1>حسابي</h1><p>سجّل الدخول لمشاهدة طلباتك.</p><SignInButton mode="modal"><button className="primary-button">تسجيل الدخول</button></SignInButton></main>;

  return <main className="account-page">
    <div className="eyebrow"><span></span> حساب العميل</div>
    <h1>مرحباً، {user?.firstName || "بك"}</h1>
    <p>طلباتك محفوظة ومربوطة بحسابك في Clerk.</p>
    <section className="account-card">
      <h2>طلباتي</h2>
      {orders.isLoading && <p>جارٍ تحميل الطلبات...</p>}
      {!orders.isLoading && orders.data?.length === 0 && <p>لا توجد طلبات مرتبطة بهذا الحساب بعد.</p>}
      {orders.data?.map((order) => <div className="account-order" key={order.id}><strong>{order.orderNumber}</strong><span>{order.total} {order.currency}</span><small>{order.status === "pending" ? "قيد المراجعة" : order.status}</small></div>)}
    </section>
  </main>;
}
