import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronDown,
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
};

const products: Product[] = [
  {
    id: 1,
    name: "زيت زيتون بكر ممتاز",
    subtitle: "معصور على البارد من زيتون شمال الأردن",
    price: "12.00 د.أ · 500 مل",
    category: "زيت الزيتون",
    tag: "حصاد الموسم",
    image: "/manus-storage/olive-oil_368c793e.jpg",
    art: "olive-art",
    emoji: "🫒",
  },
  {
    id: 2,
    name: "عسل جبلي خام",
    subtitle: "من مراعي حوران، بلا إضافات",
    price: "8.50 د.أ · 250 غ",
    category: "العسل",
    tag: "الأكثر طلباً",
    image: "/manus-storage/honey-preview_5a7b9acf.jpg",
    art: "honey-art",
    emoji: "🍯",
  },
  {
    id: 3,
    name: "زعتر بلدي مع السمسم",
    subtitle: "خلطة دارنا اليومية، محمصة بعناية",
    price: "3.50 د.أ · 250 غ",
    category: "الزعتر",
    tag: "خلطة دارنا",
    image: "/manus-storage/dish-preview_8a82762c.jpg",
    art: "thyme-art",
    emoji: "🌿",
  },
  {
    id: 4,
    name: "ورق عنب بلدي",
    subtitle: "محفوظ بماء وملح، جاهز لطبخة البيت",
    price: "4.75 د.أ · 700 غ",
    category: "مؤونة البيت",
    image: "/manus-storage/grape-leaves_a282bafc.jpg",
    art: "grape-art",
    emoji: "🍃",
  },
  {
    id: 5,
    name: "لبنة بالزعتر",
    subtitle: "لبن بلدي كثيف مع رشة من زعترنا",
    price: "3.25 د.أ · 400 غ",
    category: "الألبان",
    tag: "طازج",
    image: "/manus-storage/bread-preview_70405922.jpg",
    art: "labneh-art",
    emoji: "🥣",
  },
  {
    id: 6,
    name: "دبس رمان أصلي",
    subtitle: "مركز من رمان الموسم، حامض ومتوازن",
    price: "5.00 د.أ · 330 مل",
    category: "مؤونة البيت",
    image: "/manus-storage/dish-preview_8a82762c.jpg",
    art: "pomegranate-art",
    emoji: "❤️",
  },
];

const categories = ["التشكيلة كاملة", "زيت الزيتون", "العسل", "الزعتر", "الألبان", "مؤونة البيت", "موسمنا"];
const featuredCategories = [
  { name: "زيت الزيتون", note: "معصور على البارد", emoji: "🫒", filter: "زيت الزيتون" },
  { name: "العسل", note: "خام من مراعي حوران", emoji: "🍯", filter: "العسل" },
  { name: "الزعتر", note: "خلطة دارنا اليومية", emoji: "🌿", filter: "الزعتر" },
  { name: "الألبان", note: "طازجة من مزارعنا", emoji: "🥣", filter: "الألبان" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("التشكيلة كاملة");
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = activeCategory === "التشكيلة كاملة" || product.category === activeCategory;
      const searchMatch = `${product.name} ${product.subtitle}`.includes(search.trim());
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, search]);

  const addToCart = (product: Product) => {
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
            <div className="product-grid">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />)}
            </div>
            {filteredProducts.length === 0 && <div className="empty-products"><Leaf size={25} /><p>لا توجد نتائج مطابقة بعد. جرّب كلمة أخرى.</p></div>}
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
          <div className="drawer-note"><Check size={15} /> هذه معاينة فقط — الدفع والتوصيل يُحددان لاحقاً.</div>
          <button className="checkout-button" onClick={() => setToast("زر الدفع جاهز للربط بعد اعتماد المعاينة")}>متابعة الطلب <ArrowLeft size={17} /></button>
        </>}
      </aside></div>}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return <article className="product-card">
    <div className={`product-art ${product.art}`}>
      {product.image ? <img src={product.image} alt="" /> : <span className="art-emoji">{product.emoji}</span>}
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className="wishlist" aria-label={`إضافة ${product.name} للمفضلة`}><Heart size={17} /></button>
      <div className="art-grain"></div>
    </div>
    <div className="product-info"><div><h3>{product.name}</h3><p>{product.subtitle}</p></div><span className="product-arrow"><ArrowUpLeft size={17} /></span></div>
    <div className="product-bottom"><strong>{product.price}</strong><button onClick={onAdd}><Plus size={15} /> أضف للسلة</button></div>
  </article>;
}
