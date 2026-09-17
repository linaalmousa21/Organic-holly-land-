import { SignInButton, useAuth, useUser } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  Boxes,
  Check,
  ChevronLeft,
  FolderTree,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Tag,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { compressImageForUpload } from "@/lib/compress-image";

type ProductRow = {
  id: number; categoryId: number; name: string; subtitle: string; price: string; unitLabel: string;
  tag: string | null; image: string | null; art: string; emoji: string; stockQuantity: number;
  lowStockThreshold: number; sortOrder: number; isActive: boolean; category: string;
  images: Array<{ id?: number; url: string; storageKey: string; mediaType?: "image" | "video"; sortOrder: number; isPrimary: boolean }>;
};
type CategoryRow = { id: number; name: string; note: string; emoji: string; sortOrder: number; isFeatured: boolean };
type ProductForm = Omit<ProductRow, "id" | "category" | "tag" | "image" | "isActive" | "images"> & { tag: string; image: string; isActive: boolean; images: Array<{ url: string; storageKey: string; mediaType?: "image" | "video"; sortOrder: number; isPrimary: boolean }> };
type CategoryForm = Omit<CategoryRow, "id">;

const emptyProduct: ProductForm = {
  categoryId: 0, name: "", subtitle: "", price: "", unitLabel: "", tag: "", image: "",
  art: "olive-art", emoji: "🌿", stockQuantity: 0, lowStockThreshold: 5, sortOrder: 0, isActive: true, images: [],
};
const emptyCategory: CategoryForm = { name: "", note: "", emoji: "🌿", sortOrder: 0, isFeatured: false };

export default function Admin() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [section, setSection] = useState<"overview" | "products" | "categories" | "inventory">("overview");
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [notice, setNotice] = useState("");

  const products = trpc.admin.catalog.useQuery(undefined, { enabled: isAdmin });
  const categories = trpc.admin.categories.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const invalidateCatalog = () => {
    void utils.admin.catalog.invalidate();
    void utils.catalog.list.invalidate();
    void utils.catalog.categories.invalidate();
  };
  const createProduct = trpc.admin.createProduct.useMutation({ onSuccess: () => { invalidateCatalog(); resetProduct(); showNotice("تمت إضافة المنتج إلى الكتالوج"); } });
  const updateProduct = trpc.admin.updateProduct.useMutation({ onSuccess: () => { invalidateCatalog(); resetProduct(); showNotice("تم حفظ تعديلات المنتج"); } });
  const archiveProduct = trpc.admin.archiveProduct.useMutation({ onSuccess: () => { invalidateCatalog(); showNotice("تم إخفاء المنتج من المتجر مع الحفاظ على سجله"); } });
  const createCategory = trpc.admin.createCategory.useMutation({ onSuccess: () => { invalidateCatalog(); resetCategory(); showNotice("تمت إضافة التصنيف"); } });
  const updateCategory = trpc.admin.updateCategory.useMutation({ onSuccess: () => { invalidateCatalog(); resetCategory(); showNotice("تم حفظ تعديلات التصنيف"); } });
  const deleteCategory = trpc.admin.deleteCategory.useMutation({ onSuccess: () => { invalidateCatalog(); showNotice("تم حذف التصنيف"); }, onError: (error) => showNotice(error.message) });

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }
  function resetProduct() { setEditingProductId(null); setProductForm({ ...emptyProduct, categoryId: categories.data?.[0]?.id ?? 0 }); }
  function resetCategory() { setEditingCategoryId(null); setCategoryForm(emptyCategory); }
  function startEditProduct(product: ProductRow) {
    setEditingProductId(product.id);
    setProductForm({ ...product, tag: product.tag ?? "", image: product.image ?? "", images: product.images.map(({ id: _id, ...image }) => image) });
    setSection("products");
  }
  function startEditCategory(category: CategoryRow) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, note: category.note, emoji: category.emoji, sortOrder: category.sortOrder, isFeatured: category.isFeatured });
    setSection("categories");
  }
  function removeCategory(category: CategoryRow) {
    if (window.confirm(`حذف تصنيف «${category.name}»؟ لا يمكن حذف التصنيف إذا كان يحتوي على منتجات.`)) deleteCategory.mutate({ id: category.id });
  }
  function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!productForm.categoryId) return showNotice("اختر تصنيفاً للمنتج أولاً");
    const input = { ...productForm, tag: productForm.tag || undefined, image: productForm.image || undefined, images: productForm.images };
    if (editingProductId) updateProduct.mutate({ id: editingProductId, data: input });
    else createProduct.mutate(input);
  }
  function submitCategory(event: React.FormEvent) {
    event.preventDefault();
    if (editingCategoryId) updateCategory.mutate({ id: editingCategoryId, data: categoryForm });
    else createCategory.mutate(categoryForm);
  }
  function archive(product: ProductRow) {
    if (window.confirm(`إخفاء «${product.name}» من المتجر؟`)) archiveProduct.mutate({ id: product.id });
  }
  function quickStock(product: ProductRow, delta: number) {
    const next = Math.max(0, product.stockQuantity + delta);
    updateProduct.mutate({ id: product.id, data: {
      categoryId: product.categoryId, name: product.name, subtitle: product.subtitle, price: String(product.price), unitLabel: product.unitLabel,
      tag: product.tag ?? undefined, image: product.image ?? undefined, images: product.images, art: product.art, emoji: product.emoji, stockQuantity: next,
      lowStockThreshold: product.lowStockThreshold, sortOrder: product.sortOrder, isActive: product.isActive,
    } });
  }

  const activeProducts = products.data?.filter((product) => product.isActive) ?? [];
  const lowStock = activeProducts.filter((product) => product.stockQuantity <= product.lowStockThreshold);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return (products.data ?? []).filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query));
  }, [products.data, productSearch]);
  const busy = createProduct.isPending || updateProduct.isPending || createCategory.isPending || updateCategory.isPending;

  if (!isLoaded) return <main className="admin-loading"><RefreshCw className="spin" size={22} /> جارٍ التحقق من الصلاحيات...</main>;
  if (!isSignedIn) return <main className="admin-gate"><ShieldCheck size={34} /><h1>لوحة إدارة المتجر</h1><p>هذه الصفحة محمية. سجّل الدخول بحساب Admin للمتابعة.</p><SignInButton mode="modal"><button className="admin-primary">تسجيل الدخول</button></SignInButton><Link href="/">العودة إلى المتجر</Link></main>;
  if (!isAdmin) return <main className="admin-gate"><ShieldCheck size={34} /><h1>غير مصرح</h1><p>تحتاج إلى تعيين <code>publicMetadata.role = admin</code> في Clerk للوصول إلى لوحة الإدارة.</p><Link href="/">العودة إلى المتجر</Link></main>;

  return <div className="admin-shell" dir="rtl">
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand"><span className="admin-brand-mark">⌁</span><span><strong>عضوي الأرض المقدسة</strong><small>لوحة الإدارة</small></span></Link>
      <nav className="admin-nav" aria-label="أقسام الإدارة">
        <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard size={18} />نظرة عامة</button>
        <button className={section === "products" ? "active" : ""} onClick={() => setSection("products")}><Package size={18} />المنتجات</button>
        <button className={section === "categories" ? "active" : ""} onClick={() => setSection("categories")}><FolderTree size={18} />التصنيفات</button>
        <button className={section === "inventory" ? "active" : ""} onClick={() => setSection("inventory")}><Warehouse size={18} />المخزون {lowStock.length > 0 && <b>{lowStock.length}</b>}</button>
      </nav>
      <div className="admin-sidebar-foot"><span className="admin-status-dot"></span><span>وضع الإدارة مفعّل</span><Link href="/">زيارة المتجر <ChevronLeft size={14} /></Link></div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span className="admin-kicker">HOLY LAND ORGANIC · CONTROL CENTER</span><h1>{section === "overview" ? "نظرة عامة" : section === "products" ? "إدارة المنتجات" : section === "categories" ? "التصنيفات" : "المخزون"}</h1></div><div className="admin-user"><span>{user.fullName || user.primaryEmailAddress?.emailAddress || "Admin"}</span><span className="admin-role">ADMIN</span></div></header>

      {section === "overview" && <Overview products={activeProducts} categories={categories.data ?? []} lowStock={lowStock} onSection={setSection} />}
      {section === "products" && <section className="admin-section"><div className="admin-section-head"><div><span className="admin-kicker">CATALOG</span><h2>كل المنتجات</h2><p>أضف المنتجات وعدّل السعر والصورة والتصنيف وحالة الظهور.</p></div><button className="admin-primary" onClick={resetProduct}><Plus size={17} /> منتج جديد</button></div><div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="ابحث بالاسم أو التصنيف" /></label><span>{filteredProducts.length} منتج</span></div><div className="admin-product-list">{filteredProducts.map((product) => <ProductRowCard key={product.id} product={product} onEdit={() => startEditProduct(product)} onArchive={() => archive(product)} onStock={(delta) => quickStock(product, delta)} />)}</div>{filteredProducts.length === 0 && <EmptyState label="لا توجد منتجات مطابقة" />}</section>}
      {section === "categories" && <section className="admin-section"><div className="admin-section-head"><div><span className="admin-kicker">TAXONOMY</span><h2>تصنيفات المتجر</h2><p>نظّم الرفوف وأظهر التصنيفات الأساسية في الصفحة الرئيسية.</p></div><button className="admin-primary" onClick={resetCategory}><Plus size={17} /> تصنيف جديد</button></div><div className="admin-category-grid">{(categories.data ?? []).map((category) => <article className="admin-category-card" key={category.id}><span className="category-big-emoji">{category.emoji}</span><div><h3>{category.name}</h3><p>{category.note}</p><small>{category.isFeatured ? "ظاهر في الواجهة الرئيسية" : "تصنيف داخلي"} · ترتيب {category.sortOrder}</small></div><div className="admin-category-actions"><button className="admin-icon-btn" onClick={() => startEditCategory(category)} aria-label={`تعديل ${category.name}`}><Pencil size={16} /></button><button className="admin-icon-btn danger" onClick={() => removeCategory(category)} aria-label={`حذف ${category.name}`}><Archive size={16} /></button></div></article>)}</div></section>}
      {section === "inventory" && <Inventory products={activeProducts} onStock={quickStock} onEdit={startEditProduct} />}

      {section === "products" && <ProductFormPanel form={productForm} setForm={setProductForm} categories={categories.data ?? []} editing={Boolean(editingProductId)} busy={busy} onSubmit={submitProduct} onClose={resetProduct} />}
      {section === "categories" && <CategoryFormPanel form={categoryForm} setForm={setCategoryForm} editing={Boolean(editingCategoryId)} busy={busy} onSubmit={submitCategory} onClose={resetCategory} />}
    </main>
    {notice && <div className="admin-toast"><Check size={17} />{notice}</div>}
  </div>;
}

function Overview({ products, categories, lowStock, onSection }: { products: ProductRow[]; categories: CategoryRow[]; lowStock: ProductRow[]; onSection: (section: "products" | "categories" | "inventory") => void }) {
  const stockUnits = products.reduce((total, product) => total + product.stockQuantity, 0);
  return <section className="admin-section overview-section"><div className="admin-section-head"><div><span className="admin-kicker">GOOD MORNING, ADMIN</span><h2>لوحة المتجر في لمحة</h2><p>تابع صحة الكتالوج والمخزون من مكان واحد.</p></div><div className="overview-date">قاعدة البيانات متصلة<br /><strong>آخر تحديث الآن</strong></div></div><div className="admin-stats"><button onClick={() => onSection("products")}><span className="stat-icon"><Package size={19} /></span><b>{products.length}</b><small>منتجات مفعّلة</small></button><button onClick={() => onSection("categories")}><span className="stat-icon"><FolderTree size={19} /></span><b>{categories.length}</b><small>تصنيفات</small></button><button onClick={() => onSection("inventory")}><span className="stat-icon"><Boxes size={19} /></span><b>{stockUnits}</b><small>وحدة في المخزون</small></button><button className={lowStock.length ? "warning" : ""} onClick={() => onSection("inventory")}><span className="stat-icon"><Tag size={19} /></span><b>{lowStock.length}</b><small>تحتاج إعادة تعبئة</small></button></div><div className="admin-overview-grid"><div className="admin-panel"><div className="panel-title"><h3>حالة المخزون</h3><button onClick={() => onSection("inventory")}>فتح المخزون <ChevronLeft size={15} /></button></div>{lowStock.length === 0 ? <EmptyState label="المخزون بحالة جيدة" compact /> : lowStock.slice(0, 5).map((product) => <div className="stock-alert" key={product.id}><span className="mini-product-icon">{product.emoji}</span><div><strong>{product.name}</strong><small>{product.category}</small></div><b>{product.stockQuantity} متبقي</b></div>)}</div><div className="admin-panel quick-actions"><div className="panel-title"><h3>إجراءات سريعة</h3></div><button onClick={() => onSection("products")}><Plus size={18} /> إضافة منتج جديد <ChevronLeft size={15} /></button><button onClick={() => onSection("categories")}><FolderTree size={18} /> تنظيم التصنيفات <ChevronLeft size={15} /></button><button onClick={() => onSection("inventory")}><Warehouse size={18} /> تحديث المخزون <ChevronLeft size={15} /></button></div></div></section>;
}

function ProductRowCard({ product, onEdit, onArchive, onStock }: { product: ProductRow; onEdit: () => void; onArchive: () => void; onStock: (delta: number) => void }) {
  const stockState = product.stockQuantity === 0 ? "out" : product.stockQuantity <= product.lowStockThreshold ? "low" : "good";
  return <article className="admin-product-row"><div className={`admin-product-thumb ${product.art}`}>{product.image ? <img src={product.image} alt="" /> : <span>{product.emoji}</span>}</div><div className="admin-product-main"><div><h3>{product.name}</h3><p>{product.category} · {product.subtitle}</p></div><span className={`active-badge ${product.isActive ? "on" : "off"}`}>{product.isActive ? "ظاهر" : "مخفي"}</span></div><div className="admin-product-price"><strong>{Number(product.price).toFixed(2)} د.أ</strong><small>{product.unitLabel}</small></div><div className={`stock-pill ${stockState}`}><span></span>{product.stockQuantity} وحدة</div><div className="admin-row-actions"><button onClick={onEdit} aria-label="تعديل المنتج"><Pencil size={16} /></button><button onClick={() => onStock(1)} aria-label="زيادة المخزون"><Plus size={16} /></button><button onClick={() => onStock(-1)} disabled={product.stockQuantity === 0} aria-label="إنقاص المخزون">−</button><button onClick={onArchive} className="danger" aria-label="إخفاء المنتج"><Archive size={16} /></button></div></article>;
}

function Inventory({ products, onStock, onEdit }: { products: ProductRow[]; onStock: (product: ProductRow, delta: number) => void; onEdit: (product: ProductRow) => void }) {
  return <section className="admin-section"><div className="admin-section-head"><div><span className="admin-kicker">STOCK CONTROL</span><h2>المخزون</h2><p>حدّث الكميات بسرعة، واضبط حدّ التنبيه من تحرير المنتج.</p></div><div className="inventory-legend"><span><i className="good"></i>متوفر</span><span><i className="low"></i>منخفض</span><span><i className="out"></i>نفد</span></div></div><div className="inventory-table"><div className="inventory-table-head"><span>المنتج</span><span>التصنيف</span><span>الحد الأدنى</span><span>الكمية</span><span>إجراء</span></div>{products.map((product) => <div className="inventory-table-row" key={product.id}><div className="inventory-product"><span>{product.emoji}</span><strong>{product.name}</strong></div><span>{product.category}</span><span>{product.lowStockThreshold} وحدة</span><div className="quantity-control"><button onClick={() => onStock(product, -1)} disabled={product.stockQuantity === 0}>−</button><b>{product.stockQuantity}</b><button onClick={() => onStock(product, 1)}>+</button></div><button className="admin-text-btn" onClick={() => onEdit(product)}><Pencil size={14} /> تعديل</button></div>)}</div></section>;
}

function ProductFormPanel({ form, setForm, categories, editing, busy, onSubmit, onClose }: { form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>>; categories: CategoryRow[]; editing: boolean; busy: boolean; onSubmit: (event: React.FormEvent) => void; onClose: () => void }) {
  const [previewUrl, setPreviewUrl] = useState(form.image || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setPreviewUrl(form.image || "");
  }, [form.image]);

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function uploadImage(file: File) {
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setImageError("");
    setUploadingImage(true);
    try {
      const compressedFile = await compressImageForUpload(file);
      const body = new FormData();
      body.append("image", compressedFile);
      const response = await fetch("/api/admin/product-image", { method: "POST", body, credentials: "include" });
      const payload = await response.json().catch(() => ({})) as { url?: string; key?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "تعذر رفع الصورة");
      setForm((current) => {
        const isPrimary = current.images.length === 0;
        const image = { url: payload.url!, storageKey: payload.key || payload.url!, mediaType: "image" as const, sortOrder: current.images.length, isPrimary };
        return { ...current, image: isPrimary ? image.url : current.image, images: [...current.images, image] };
      });
    } catch (error) {
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(form.image || "");
      setImageError(error instanceof Error ? error.message : "تعذر رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadVideo(file: File) {
    setImageError("");
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append("video", file);
      const response = await fetch("/api/admin/product-video", { method: "POST", body, credentials: "include" });
      const payload = await response.json().catch(() => ({})) as { url?: string; key?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "تعذر رفع الفيديو");
      setForm((current) => ({ ...current, images: [...current.images, { url: payload.url!, storageKey: payload.key || payload.url!, mediaType: "video", sortOrder: current.images.length, isPrimary: false }] }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "تعذر رفع الفيديو");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    const next = form.images.filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, sortOrder: imageIndex, isPrimary: imageIndex === 0 ? image.isPrimary || index === 0 : image.isPrimary }));
    const primary = next.find((image) => image.isPrimary) ?? next[0];
    setForm((current) => ({ ...current, images: next, image: primary?.url || "" }));
  }

  function setPrimaryImage(index: number) {
    if (form.images[index]?.mediaType === "video") return;
    const next = form.images.map((image, imageIndex) => ({ ...image, isPrimary: imageIndex === index }));
    setForm((current) => ({ ...current, images: next, image: next[index].url }));
    setPreviewUrl(next[index].url);
  }

  return <div className="admin-form-panel"><div className="form-panel-head"><div><span className="admin-kicker">PRODUCT EDITOR</span><h2>{editing ? "تعديل المنتج" : "إضافة منتج"}</h2></div><button onClick={onClose} aria-label="إغلاق"><X size={18} /></button></div><form onSubmit={onSubmit} className="admin-form"><label>اسم المنتج<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="مثال: عسل جبلي خام" /></label><label>الوصف المختصر<input required value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} /></label><div className="form-grid-2"><label>التصنيف<select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })}><option value={0}>اختر تصنيفاً</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.emoji} {category.name}</option>)}</select></label><label>السعر بالدينار<input required inputMode="decimal" pattern="^\d+(\.\d{1,2})?$" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="0.00" /></label></div><div className="form-grid-2"><label>الوحدة<input required value={form.unitLabel} onChange={(event) => setForm({ ...form, unitLabel: event.target.value })} placeholder="500 مل" /></label><label>الشارة<input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} placeholder="الأكثر طلباً" /></label></div><label>صور وفيديوهات المنتج<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={(event) => { const files = Array.from(event.target.files ?? []); files.forEach((file) => void uploadImage(file)); event.currentTarget.value = ""; }} /><small>صور المنتج</small><input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={uploadingImage} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadVideo(file); event.currentTarget.value = ""; }} /><small>فيديو قصير — MP4 أو WebM أو MOV، حتى 20 MB</small>{previewUrl && <img src={previewUrl} alt="معاينة الصورة الرئيسية" className="product-image-preview" />}<div className="product-gallery-editor">{form.images.map((image, index) => <div className={`gallery-editor-item ${image.isPrimary ? "primary" : ""}`} key={`${image.url}-${index}`}>{image.mediaType === "video" ? <video src={image.url} muted playsInline /> : <img src={image.url} alt={`وسيط ${index + 1}`} />}<button type="button" onClick={() => setPrimaryImage(index)} disabled={image.mediaType === "video"}>{image.mediaType === "video" ? "فيديو" : image.isPrimary ? "الصورة الرئيسية" : "تعيين كرئيسية"}</button><button type="button" onClick={() => removeImage(index)} aria-label="حذف الوسيط">حذف</button></div>)}</div>{uploadingImage && <small>جارٍ رفع الوسيط...</small>}{imageError && <small className="image-upload-error">{imageError}</small>}</label><label>رابط الصورة الرئيسية<input value={form.image} onChange={(event) => { setForm({ ...form, image: event.target.value }); setPreviewUrl(event.target.value); }} placeholder="/manus-storage/..." /></label><div className="form-grid-3"><label>الكمية<input required type="number" min={0} value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })} /></label><label>حد التنبيه<input required type="number" min={0} value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: Number(event.target.value) })} /></label><label>الترتيب<input required type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label></div><div className="form-grid-2"><label>رمز العرض<input required value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} /></label><label>نمط البطاقة<input required value={form.art} onChange={(event) => setForm({ ...form, art: event.target.value })} /></label></div><label className="admin-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> إظهار المنتج في واجهة المتجر</label><button className="admin-primary form-submit" disabled={busy || uploadingImage} type="submit"><Save size={17} />{uploadingImage ? "جارٍ رفع الوسيط..." : busy ? "جارٍ الحفظ..." : "حفظ المنتج"}</button></form></div>;
}

function CategoryFormPanel({ form, setForm, editing, busy, onSubmit, onClose }: { form: CategoryForm; setForm: React.Dispatch<React.SetStateAction<CategoryForm>>; editing: boolean; busy: boolean; onSubmit: (event: React.FormEvent) => void; onClose: () => void }) {
  return <div className="admin-form-panel"><div className="form-panel-head"><div><span className="admin-kicker">CATEGORY EDITOR</span><h2>{editing ? "تعديل التصنيف" : "إضافة تصنيف"}</h2></div><button onClick={onClose} aria-label="إغلاق"><X size={18} /></button></div><form onSubmit={onSubmit} className="admin-form"><label>اسم التصنيف<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="مثال: المخللات" /></label><label>الوصف المختصر<input required value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="أصناف من مؤونة البيت" /></label><div className="form-grid-2"><label>الرمز<input required value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} /></label><label>الترتيب<input required type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label></div><label className="admin-checkbox"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> إظهار كبطاقة رئيسية في المتجر</label><button className="admin-primary form-submit" disabled={busy} type="submit"><Save size={17} />{busy ? "جارٍ الحفظ..." : "حفظ التصنيف"}</button></form></div>;
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) { return <div className={`admin-empty ${compact ? "compact" : ""}`}><Package size={compact ? 20 : 28} /><span>{label}</span></div>; }
