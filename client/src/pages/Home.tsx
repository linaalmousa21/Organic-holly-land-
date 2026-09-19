import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Leaf,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  subtitle: string;
  price: string;
  category: string;
  tag?: string;
  image?: string;
  art: string;
  emoji: string;
  unitLabel: string;
  stockQuantity: number;
  lowStockThreshold: number;
  images?: Array<{ id: number; url: string; mediaType?: "image" | "video"; sortOrder: number; isPrimary: boolean }>;
};

const jordanLocations = [
  { governorate: "محافظة العاصمة", cities: ["عمان"] },
  { governorate: "محافظة إربد", cities: ["إربد"] },
  { governorate: "محافظة الزرقاء", cities: ["الزرقاء"] },
  { governorate: "محافظة جرش", cities: ["جرش"] },
  { governorate: "محافظة عجلون", cities: ["عجلون"] },
  { governorate: "محافظة المفرق", cities: ["المفرق"] },
  { governorate: "محافظة البلقاء", cities: ["السلط"] },
  { governorate: "محافظة الكرك", cities: ["الكرك"] },
  { governorate: "محافظة الطفيلة", cities: ["الطفيلة"] },
  { governorate: "محافظة معان", cities: ["معان"] },
  { governorate: "محافظة العقبة", cities: ["العقبة"] },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("التشكيلة كاملة");
  const catalogQuery = trpc.catalog.list.useQuery();
  const categoriesQuery = trpc.catalog.categories.useQuery();
  const products = useMemo<Product[]>(() => (catalogQuery.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    subtitle: item.subtitle,
    price: `${Number(item.price).toFixed(2)} د.أ · ${item.unitLabel}`,
    category: item.category,
    tag: item.tag ?? undefined,
    image: item.image ?? undefined,
    art: item.art,
    emoji: item.emoji,
    unitLabel: item.unitLabel,
    stockQuantity: item.stockQuantity,
    lowStockThreshold: item.lowStockThreshold,
    images: item.images ?? [],
  })), [catalogQuery.data]);
  const categories = useMemo(() => ["التشكيلة كاملة", ...(categoriesQuery.data ?? []).map((category) => category.name)], [categoriesQuery.data]);
  const featuredCategories = useMemo(() => (categoriesQuery.data ?? []).filter((category) => category.isFeatured).map((category) => ({ name: category.name, note: category.note, emoji: category.emoji, filter: category.name })), [categoriesQuery.data]);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "", address: "", city: "", notes: "" });
  const [confirmation, setConfirmation] = useState<{ orderNumber: string; total: number; shippingFee: number; shippingLabel: string } | null>(null);
  const quoteItems = useMemo(() => Object.values(cart.reduce<Record<number, { productId: number; quantity: number }>>((acc, product) => { acc[product.id] ??= { productId: product.id, quantity: 0 }; acc[product.id].quantity += 1; return acc; }, {})), [cart]);
  const shippingQuote = trpc.orders.quote.useQuery({ city: checkout.city, items: quoteItems }, { enabled: cart.length > 0 && checkout.city.trim().length > 1 });
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (result) => {
      setCart([]);
      setCartOpen(false);
      setConfirmation({ orderNumber: result.orderNumber, total: result.total, shippingFee: result.shippingFee, shippingLabel: result.shippingLabel });
    },
    onError: (error) => {
      setToast(error.message || "تعذر حفظ الطلب، حاول مرة أخرى");
      window.setTimeout(() => setToast(""), 3200);
    },
  });

  const filteredProducts = useMemo(() => {
    if (catalogQuery.isLoading || catalogQuery.isError) return [];
    return products.filter((product) => {
      const categoryMatch = activeCategory === "التشكيلة كاملة" || product.category === activeCategory;
      const searchMatch = `${product.name} ${product.subtitle}`.includes(search.trim());
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, search, products, catalogQuery.isLoading, catalogQuery.isError]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity < 1) {
      setToast("هذا المنتج نفد مؤقتاً");
      window.setTimeout(() => setToast(""), 2400);
      return;
    }
    setCart((current) => [...current, product]);
    setToast(`أضيف «${product.name}» إلى السلة`);
    window.setTimeout(() => setToast(""), 2400);
  };

  const removeFromCart = (index: number) => {
    setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="store-shell" dir="rtl">
      <div className="topline">
        <div className="topline-inner">
          <span><Sparkles size={14} /> منتجات ريفية عضوية من شمال الأردن</span>
          <span className="topline-note">التوصيل داخل الأردن — قريباً</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a className="brand-mark" href="#top" aria-label="عضوي الأرض المقدسة — HOLY LAND ORGANIC">
            <span className="brand-symbol acorn-symbol" aria-hidden="true"><span className="acorn-cap"></span><span className="acorn-body">•</span><span className="acorn-leaf">⌁</span></span>
            <span className="brand-copy">
              <strong>عضوي الأرض المقدسة</strong>
              <small>HOLY LAND ORGANIC</small>
            </span>
          </a>
          <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="التنقل الرئيسي">
            <a href="#products" onClick={() => setMenuOpen(false)}>تسوّق</a>
            <a href="#story" onClick={() => setMenuOpen(false)}>قصتنا</a>
            <a href="#season" onClick={() => setMenuOpen(false)}>موسمنا</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>تواصل معنا</a>
          </nav>
          <div className="header-actions">
            <AuthControls />
            <button className="icon-button" aria-label="البحث" onClick={() => setSearchOpen((open) => !open)}><Search size={19} /></button>
            <button className="cart-button" aria-label="فتح سلة المشتريات" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={18} />
              <span>السلة</span>
              {cart.length > 0 && <b>{cart.length}</b>}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-row">
            <div className="container search-inner">
              <Search size={18} />
              <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن زيت، زعتر، لبنة..." aria-label="ابحث عن منتج" />
              <button className="search-close" onClick={() => { setSearch(""); setSearchOpen(false); }}><X size={17} /></button>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span></span> من الحقل إلى مائدتك</div>
              <h1 className="hero-title"><em>Organic Holy Land</em></h1>
              <p className="hero-lead">منتجات ريفية وعضوية من الأرض المقدسة وروابي حوران. نختارها من مواسمنا ونوصلها إلى بيتك كما تحبها.</p>
              <div className="hero-actions">
                <a className="primary-button" href="#products">اكتشف التشكيلة <ArrowLeft size={17} /></a>
                <a className="text-link" href="#story">تعرف على قصتنا <ArrowUpLeft size={17} /></a>
              </div>
              <div className="hero-note"><span className="note-icon"><Leaf size={16} /></span><span><strong>من خير الأرض</strong><small>بمكونات واضحة، وقلوب تعرفها</small></span></div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrap">
                <img src="/manus-storage/hero-table_f2893f80.jpg" alt="تشكيلة من المأكولات الريفية على مائدة" />
                <div className="image-wash"></div>
              </div>
              <div className="season-card" id="season">
                <div className="season-card-top"><span>اختيارنا الآن</span><span className="lime-dot"></span></div>
                <strong>صندوق الموسم</strong>
                <p>زيتون، زعتر، مخللات<br />وأشياء تشبه البيت.</p>
                <a href="#products">تصفّح الصندوق <ArrowLeft size={15} /></a>
              </div>
              <div className="round-stamp"><span>ORGANIC</span><strong>من<br />الأرض</strong><span>EST. 2024</span></div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-grid">
            <div><span className="trust-icon"><Leaf size={18} /></span><span><strong>عضوي باهتمام</strong><small>مكونات نعرف مصدرها</small></span></div>
            <div><span className="trust-icon"><Truck size={18} /></span><span><strong>من المزرعة إلى بابك</strong><small>تغليف يليق بالمنتج</small></span></div>
            <div><span className="trust-icon"><Heart size={18} /></span><span><strong>طعم يُشبه البيت</strong><small>وصفات وذكريات ريفية</small></span></div>
            <div><span className="trust-icon"><Clock3 size={18} /></span><span><strong>موسم بموسم</strong><small>نحترم إيقاع الأرض</small></span></div>
          </div>
        </section>

        <section className="featured-categories" aria-labelledby="category-heading">
          <div className="container">
            <div className="category-heading-row">
              <div><div className="eyebrow"><span></span> تسوّق حسب النوع</div><h2 id="category-heading">خيراتٌ تعرفها.</h2></div>
              <p>ابدأ من الصنف الذي تحبه، وستجد ما يشبهه على رفوفنا.</p>
            </div>
            <div className="featured-category-grid">
              {featuredCategories.map((category) => <button key={category.name} className="featured-category-card" onClick={() => { setActiveCategory(category.filter); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span className="category-emoji" aria-hidden="true">{category.emoji}</span>
                <span className="category-card-copy"><strong>{category.name}</strong><small>{category.note}</small></span>
                <ArrowLeft className="category-card-arrow" size={17} />
              </button>)}
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow"><span></span> من رفوفنا</div><h2>مؤونة تُفرح <em>البيت.</em></h2></div>
              <p>أصناف مختارة من خيرات شمال الأردن — من الزيت المعصور على البارد إلى لبنة الصباح.</p>
            </div>
            <div className="category-tabs" role="tablist" aria-label="تصنيف المنتجات">
              {categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
            {catalogQuery.isLoading && <div className="empty-products"><Leaf size={25} /><p>جارٍ تحميل خيراتنا من قاعدة البيانات...</p></div>}
            {catalogQuery.isError && <div className="empty-products"><Leaf size={25} /><p>تعذر تحميل المنتجات الآن. حاول تحديث الصفحة.</p></div>}
            {!catalogQuery.isLoading && !catalogQuery.isError && <div className="product-grid">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} onDetails={() => setSelectedProduct(product)} />)}
            </div>}
            {!catalogQuery.isLoading && !catalogQuery.isError && filteredProducts.length === 0 && <div className="empty-products"><Leaf size={25} /><p>لا توجد نتائج مطابقة بعد. جرّب كلمة أخرى.</p></div>}
            <p className="preview-price-note">* الأسعار المعروضة تجريبية لهذه المعاينة، ويمكن تعديلها عند اعتماد المتجر.</p>
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="container story-grid">
            <div className="story-visual">
              <div className="story-photo"><img src="/manus-storage/grape-leaves_a282bafc.jpg" alt="ورق عنب من المطبخ الريفي" /></div>
              <div className="story-label"><span>01</span><strong>نحفظ الحكاية<br />في كل مرطبان.</strong></div>
            </div>
            <div className="story-copy">
              <div className="eyebrow"><span></span> قصتنا</div>
              <h2>نأخذ من الأرض<br /><em>ما يكفيها.</em></h2>
              <p>في قرى شمال الأردن، نعرف أن أجمل الأشياء لا تحتاج إلى كثير. زيتونة تُقطف في وقتها، زعتر يُفرك باليد، ولبنة تُصفّى على مهل. هذه هي الفكرة وراء Organic Holy Land.</p>
              <p>نضع خيرات المزارع الصغيرة في متناولك، ونحافظ على مذاقها الأصيل بتغليف بسيط ومحترم.</p>
              <a className="text-link dark-link" href="#contact">احكِ لنا عن بيتك <ArrowLeft size={17} /></a>
            </div>
          </div>
        </section>

        <section className="manifesto-section">
          <div className="container manifesto-inner">
            <div className="manifesto-mark">“</div>
            <p>الأكل البلدي ليس ترنداً.<br /><em>هو ذاكرة نعيشها كل يوم.</em></p>
            <span>— من روابي حوران</span>
          </div>
        </section>

        <section className="newsletter-section" id="contact">
          <div className="container newsletter-inner">
            <div><div className="eyebrow light"><span></span> خليك قريب</div><h2>مواسمنا في بريدك.</h2><p>أخبار المنتجات الجديدة، وصفات من المطبخ الريفي، وتفاصيل الموسم القادم.</p></div>
            <form onSubmit={(event) => { event.preventDefault(); setToast("تم تسجيل اهتمامك — شكراً لقربك منّا"); window.setTimeout(() => setToast(""), 2400); }}>
              <input type="email" required placeholder="بريدك الإلكتروني" aria-label="البريد الإلكتروني" />
              <button type="submit">سجّل اهتمامي <ArrowLeft size={17} /></button>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand"><a className="brand-mark" href="#top" aria-label="عضوي الأرض المقدسة — HOLY LAND ORGANIC"><span className="brand-symbol acorn-symbol" aria-hidden="true"><span className="acorn-cap"></span><span className="acorn-body">•</span><span className="acorn-leaf">⌁</span></span><span className="brand-copy"><strong>عضوي الأرض المقدسة</strong><small>HOLY LAND ORGANIC</small></span></a><p>من الأرض المقدسة وروابي حوران<br />إلى بيتك، بمحبة.</p></div>
          <div><strong className="footer-title">استكشف</strong><a href="#products">المنتجات</a><a href="#story">قصتنا</a><a href="#season">موسمنا</a></div>
          <div><strong className="footer-title">نحتاج مساعدتك؟</strong><a href="#contact">تواصل معنا</a><a href="#contact">الشحن والتوصيل</a><a href="#contact">الأسئلة الشائعة</a></div>
          <div className="footer-social"><strong className="footer-title">تابع الحكاية</strong><div className="social-row"><button aria-label="Instagram">ig</button><button aria-label="Facebook">f</button><button aria-label="WhatsApp">wa</button></div><small>© 2024 Organic Holy Land</small></div>
        </div>
        <div className="container footer-bottom"><span>صُنع باحترام لخيرات الأرض</span><span>معاينة أولية — بانتظار ملاحظاتك</span></div>
      </footer>

      {cartOpen && <div className="cart-overlay" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head"><div><span className="eyebrow"><span></span> مشترياتك</span><h3>سلة المونة</h3></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة"><X size={20} /></button></div>
        {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={32} /><h4>السلة فاضية حالياً</h4><p>أضف شيئاً من رفوفنا، وخلّينا نجهّز لك الطلب.</p><button className="primary-button" onClick={() => { setCartOpen(false); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}>تصفّح المنتجات <ArrowLeft size={16} /></button></div> : <>
          <div className="cart-list">{cart.map((product, index) => <div className="cart-line" key={`${product.id}-${index}`}><span className={`mini-art ${product.art}`}>{product.emoji}</span><div><strong>{product.name}</strong><small>{product.price}</small></div><button onClick={() => removeFromCart(index)} aria-label={`إزالة ${product.name}`}><Minus size={15} /></button></div>)}</div>
          <div className="drawer-note"><Check size={15} /> احفظ بيانات التوصيل لإصدار طلبك. الدفع الإلكتروني سيُفعّل بعد ربط HyperPay.</div>
          {shippingQuote.data && <div className="order-summary"><span>المجموع الفرعي <b>{shippingQuote.data.subtotal.toFixed(2)} د.أ</b></span><span>الشحن ({shippingQuote.data.shippingLabel}) <b>{shippingQuote.data.shippingFee.toFixed(2)} د.أ</b></span><strong>الإجمالي <b>{shippingQuote.data.total.toFixed(2)} د.أ</b></strong></div>}
          <form className="order-form" onSubmit={(event) => { event.preventDefault(); createOrderMutation.mutate({ ...checkout, items: quoteItems }); }}>
            <input required minLength={2} placeholder="الاسم الكامل" aria-label="الاسم الكامل" value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} />
            <input required type="email" placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" value={checkout.email} onChange={(event) => setCheckout({ ...checkout, email: event.target.value })} />
            <input required minLength={7} placeholder="رقم الهاتف" aria-label="رقم الهاتف" value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} />
            <input required minLength={5} placeholder="العنوان بالتفصيل" aria-label="العنوان بالتفصيل" value={checkout.address} onChange={(event) => setCheckout({ ...checkout, address: event.target.value })} />
            <select required className="location-select" aria-label="المحافظة أو المدينة" value={checkout.city} onChange={(event) => setCheckout({ ...checkout, city: event.target.value })}>
              <option value="">اختر المحافظة أو المدينة</option>
              {jordanLocations.map((location) => <optgroup key={location.governorate} label={location.governorate}>{location.cities.map((city) => <option key={city} value={city}>{city}</option>)}</optgroup>)}
            </select>
            <textarea placeholder="ملاحظات إضافية (اختياري)" aria-label="ملاحظات إضافية" value={checkout.notes} onChange={(event) => setCheckout({ ...checkout, notes: event.target.value })} />
            <button className="checkout-button" type="submit" disabled={createOrderMutation.isPending}>{createOrderMutation.isPending ? "جارٍ حفظ الطلب..." : <>حفظ الطلب والمتابعة <ArrowLeft size={17} /></>}</button>
          </form>
        </>}
      </aside></div>}

      {confirmation && <div className="confirmation-overlay" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><div className="confirmation-card"><span className="confirmation-icon"><Check size={25} /></span><div className="eyebrow"><span></span> تم استلام الطلب</div><h3 id="confirmation-title">شكراً لثقتك بنا.</h3><p>تم حفظ طلبك بنجاح، وسنتواصل معك لتأكيد التوصيل والدفع.</p><div className="confirmation-details"><span>رقم الطلب <b>{confirmation.orderNumber}</b></span><span>التوصيل إلى <b>{confirmation.shippingLabel}</b></span><span>الإجمالي <b>{confirmation.total.toFixed(2)} د.أ</b></span><span>حالة الدفع <b>بانتظار الدفع</b></span></div><button className="primary-button" onClick={() => setConfirmation(null)}>العودة للمتجر <ArrowLeft size={17} /></button></div></div>}
      {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={() => { addToCart(selectedProduct); setSelectedProduct(null); }} />}
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function ProductDetails({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: () => void }) {
  const gallery = product.images?.length ? [...product.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder) : product.image ? [{ id: 0, url: product.image, sortOrder: 0, isPrimary: true }] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex];
  const move = (delta: number) => setActiveIndex((current) => gallery.length ? (current + delta + gallery.length) % gallery.length : 0);
  return <div className="product-details-overlay" role="dialog" aria-modal="true" aria-labelledby="product-details-title" onClick={onClose}><div className="product-details-card" onClick={(event) => event.stopPropagation()}><button className="product-details-close" type="button" onClick={onClose} aria-label="إغلاق"><X size={20} /></button><div className="product-details-gallery">{activeImage ? (activeImage.mediaType === "video" ? <video src={activeImage.url} controls autoPlay muted playsInline /> : <img src={activeImage.url} alt={product.name} />) : <span className="art-emoji">{product.emoji}</span>}{gallery.length > 1 && <><button type="button" className="gallery-nav gallery-prev" onClick={() => move(-1)} aria-label="الصورة السابقة"><ChevronRight size={22} /></button><button type="button" className="gallery-nav gallery-next" onClick={() => move(1)} aria-label="الصورة التالية"><ChevronLeft size={22} /></button></>}<div className="gallery-thumbnails">{gallery.map((image, index) => <button type="button" className={index === activeIndex ? "active" : ""} key={image.id || image.url} onClick={() => setActiveIndex(index)}>{image.mediaType === "video" ? <span className="video-thumb"><video src={image.url} muted playsInline /><b>▶</b></span> : <img src={image.url} alt={`${product.name} ${index + 1}`} />}</button>)}</div></div><div className="product-details-copy"><span className="eyebrow"><span></span>{product.category}</span><h2 id="product-details-title">{product.name}</h2><p>{product.subtitle}</p><strong>{product.price}</strong><button type="button" className="primary-button" onClick={onAdd} disabled={product.stockQuantity < 1}>{product.stockQuantity < 1 ? "نفد مؤقتاً" : "أضف للسلة"}<Plus size={17} /></button></div></div></div>;
}

function ProductCard({ product, onAdd, onDetails }: { product: Product; onAdd: () => void; onDetails: () => void }) {
  const outOfStock = product.stockQuantity < 1;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;
  const video = product.images?.find((image) => image.mediaType === "video");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        element.pause();
        setIsPlaying(false);
      }
    }, { threshold: 0.55 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [video]);

  function toggleSound(event: React.MouseEvent) {
    event.stopPropagation();
    const element = videoRef.current;
    if (!element) return;
    const nextMuted = !element.muted;
    element.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) void element.play().then(() => setIsPlaying(true));
  }

  function togglePlayback(event: React.MouseEvent) {
    event.stopPropagation();
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      void element.play().then(() => setIsPlaying(true));
    } else {
      element.pause();
      setIsPlaying(false);
    }
  }

  return <article className={`product-card ${outOfStock ? "is-out-of-stock" : ""}`}>
    <div role="button" tabIndex={0} className={`product-art ${product.art}`} onClick={onDetails} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onDetails(); } }} aria-label={`عرض تفاصيل ${product.name}`}>
      {video ? <><video ref={videoRef} src={video.url} muted={isMuted} loop playsInline preload="metadata" aria-label={`فيديو ${product.name}`} /> <span className="product-video-controls" onClick={(event) => event.stopPropagation()}><button type="button" onClick={toggleSound} aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}>{isMuted ? "🔇 الصوت" : "🔊 الصوت"}</button><button type="button" onClick={togglePlayback} aria-label={isPlaying ? "إيقاف الفيديو" : "تشغيل الفيديو"}>{isPlaying ? "إيقاف" : "تشغيل"}</button></span></> : product.image ? <img src={product.image} alt="" /> : <span className="art-emoji">{product.emoji}</span>}
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className="wishlist" aria-label={`إضافة ${product.name} للمفضلة`}><Heart size={17} /></button>
      <div className="art-grain"></div>
    </div>
    <button type="button" className="product-info" onClick={onDetails}><div><h3>{product.name}</h3><p>{product.subtitle}</p></div><span className="product-arrow"><ArrowUpLeft size={17} /></span></button>
    <div className="product-bottom"><strong>{product.price}</strong><button onClick={onAdd} disabled={outOfStock}>{outOfStock ? "نفد مؤقتاً" : <><Plus size={15} /> {lowStock ? `متبقي ${product.stockQuantity}` : "أضف للسلة"}</>}</button></div>
  </article>;
}

function AuthControls() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) return null;
  return <div className="auth-controls"><Show when="signed-out"><SignInButton mode="modal"><button className="auth-link" type="button">دخول</button></SignInButton><SignUpButton mode="modal"><button className="auth-signup" type="button">إنشاء حساب</button></SignUpButton></Show><Show when="signed-in"><UserButton /></Show></div>;
}
