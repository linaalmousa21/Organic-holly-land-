import { SignInButton, useAuth, useUser } from "@clerk/react";
import { trpc } from "@/lib/trpc";

export default function Admin() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const orders = trpc.admin.orders.useQuery(undefined, { enabled: Boolean(isAdmin) });
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => orders.refetch() });

  if (!isLoaded) return <main className="account-page"><p>جارٍ التحقق من الصلاحيات...</p></main>;
  if (!isSignedIn) return <main className="account-page"><h1>لوحة الإدارة</h1><p>هذه الصفحة محمية. سجّل الدخول أولاً.</p><SignInButton mode="modal"><button className="primary-button">تسجيل الدخول</button></SignInButton></main>;
  if (!isAdmin) return <main className="account-page"><h1>غير مصرح</h1><p>تحتاج إلى دور Admin في Clerk للوصول إلى هذه الصفحة.</p></main>;

  return <main className="account-page">
    <div className="eyebrow"><span></span> إدارة المتجر</div>
    <h1>لوحة الطلبات</h1>
    <p>تظهر هنا الطلبات المخزنة في قاعدة البيانات، ولا يمكن تعديلها إلا بدور Admin.</p>
    <section className="account-card">
      {orders.isLoading && <p>جارٍ تحميل الطلبات...</p>}
      {orders.data?.map((order) => <div className="admin-order" key={order.id}><div><strong>{order.orderNumber}</strong><small>{order.customerName} · {order.shippingCity} · {order.total} {order.currency}</small></div><select value={order.status} disabled={updateStatus.isPending} onChange={(event) => updateStatus.mutate({ orderId: order.id, status: event.target.value as "pending" | "confirmed" | "shipped" | "cancelled" })}><option value="pending">قيد المراجعة</option><option value="confirmed">مؤكد</option><option value="shipped">تم الشحن</option><option value="cancelled">ملغى</option></select></div>)}
    </section>
  </main>;
}
