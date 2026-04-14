import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase";

const ORDER_STATUSES = ["pending","confirmed","preparing","out_for_delivery","delivered","cancelled"];
const ST_COLOR = {pending:"#f59f00",confirmed:"#0ea5e9",preparing:"#8b5cf6",out_for_delivery:"#f97316",delivered:"#22c55e",cancelled:"#ef4444"};
const ST_LABEL = {pending:"⏳ Pending",confirmed:"✅ Confirmed",preparing:"👨‍🍳 Preparing",out_for_delivery:"🛵 Out for Delivery",delivered:"📦 Delivered",cancelled:"❌ Cancelled"};
const DEF_PROD = {name:"",price:"",original_price:"",category:"",image:"",unit:"piece",badge:"",discount:"",stock:"",description:"",available:true};
const DEF_CAT = {id:"",name:"",emoji:"",color:"#22c55e",bg:"#f0fdf4"};
const DEF_OFFER = {code:"",discount:"",type:"percent",min_order:"",description:"",active:true};
const DEF_BANNER = {title:"",subtitle:"",bg:"linear-gradient(135deg,#22c55e,#16a34a)",active:true};
const GRADIENTS = ["linear-gradient(135deg,#22c55e,#16a34a)","linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)","linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#0f172a,#1e3a5f)","linear-gradient(135deg,#ff6b6b,#feca57)","linear-gradient(135deg,#48dbfb,#ff9ff3)"];

const S = {
  page:{padding:"0 0 40px",color:"#f1f5f9",background:"#0f172a",minHeight:"100vh",fontFamily:"'Inter',-apple-system,sans-serif"},
  header:{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"18px 20px 16px",borderBottom:"1px solid #1e293b",position:"sticky",top:0,zIndex:100},
  input:{padding:"10px 13px",borderRadius:10,border:"1px solid #334155",background:"#1e293b",color:"#f1f5f9",minWidth:160,fontSize:13,fontFamily:"inherit",outline:"none"},
  btn:{padding:"10px 18px",borderRadius:10,border:"none",background:"#22c55e",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"},
  btnSec:{padding:"10px 18px",borderRadius:10,border:"none",background:"#334155",color:"#f1f5f9",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"},
  btnDanger:{padding:"10px 18px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"},
  btnSm:{padding:"7px 12px",borderRadius:8,border:"none",background:"#22c55e",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"},
  btnSmSec:{padding:"7px 12px",borderRadius:8,border:"none",background:"#334155",color:"#f1f5f9",cursor:"pointer",fontWeight:600,fontSize:12,fontFamily:"inherit"},
  btnSmDanger:{padding:"7px 12px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"},
  card:{background:"#1e293b",borderRadius:14,padding:16,border:"1px solid #334155"},
  h2:{fontSize:16,fontWeight:900,color:"#f1f5f9",margin:"0 0 14px",letterSpacing:-0.3},
  label:{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:0.5,textTransform:"uppercase",marginBottom:6,display:"block"},
};

function StockPill({ stock }) {
  const s = Number(stock ?? 999);
  if (s === 0) return <span style={{background:"#fef2f2",color:"#ef4444",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:800}}>🔴 Out of Stock</span>;
  if (s <= 3) return <span style={{background:"#fef2f2",color:"#ef4444",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:800}}>🔥 Only {s} left!</span>;
  if (s <= 10) return <span style={{background:"#fff7ed",color:"#f97316",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700}}>🟠 {s} left</span>;
  if (s <= 30) return <span style={{background:"#fefce8",color:"#eab308",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700}}>🟡 {s} left</span>;
  if (s < 999) return <span style={{background:"#f0fdf4",color:"#22c55e",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700}}>🟢 {s} in stock</span>;
  return <span style={{background:"#f0fdf4",color:"#22c55e",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700}}>♾️ Unlimited</span>;
}

function StockControl({ product, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const cur = product.stock != null ? Number(product.stock) : null;

  const apply = async (newVal) => {
    if (isNaN(newVal) || newVal < 0) return;
    setSaving(true);
    await supabase.from("products").update({ stock: newVal }).eq("id", product.id);
    setSaving(false);
    setEditing(false);
    onSave && onSave();
  };

  const quickAdj = async (delta) => {
    const nv = Math.max(0, (cur ?? 0) + delta);
    setSaving(true);
    await supabase.from("products").update({ stock: nv }).eq("id", product.id);
    setSaving(false);
    onSave && onSave();
  };

  if (editing) return (
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)} type="number" min="0"
        style={{...S.input,width:90,padding:"7px 10px",fontSize:13,borderColor:"#22c55e"}}
        onKeyDown={e => { if (e.key === "Enter") apply(Number(val)); if (e.key === "Escape") setEditing(false); }}
        placeholder="New qty"/>
      <button onClick={() => apply(Number(val))} disabled={saving || val === ""} style={{...S.btnSm,opacity:saving?0.6:1}}>✅ Set</button>
      <button onClick={() => setEditing(false)} style={S.btnSmSec}>✕</button>
      {saving && <span style={{fontSize:11,color:"#f59f00"}}>Saving...</span>}
    </div>
  );

  return (
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <StockPill stock={product.stock}/>
      <div style={{display:"flex",alignItems:"center",background:"#0f172a",borderRadius:9,overflow:"hidden",border:"1px solid #334155"}}>
        {[-5,-1].map(d => (
          <button key={d} onClick={() => quickAdj(d)} disabled={saving || cur === 0} title={`${d}`}
            style={{background:"none",border:"none",color:(cur===0||saving)?"#334155":"#ef4444",width:30,height:30,cursor:(cur===0||saving)?"not-allowed":"pointer",fontWeight:800,fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #334155"}}>
            {d}
          </button>
        ))}
        <span style={{fontSize:13,fontWeight:800,color:"#f1f5f9",minWidth:36,textAlign:"center",padding:"0 4px"}}>{cur ?? "∞"}</span>
        {[1,5].map(d => (
          <button key={d} onClick={() => quickAdj(d)} disabled={saving} title={`+${d}`}
            style={{background:"none",border:"none",color:saving?"#334155":"#22c55e",width:30,height:30,cursor:saving?"not-allowed":"pointer",fontWeight:800,fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",borderLeft:"1px solid #334155"}}>
            +{d}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:4}}>
        {[0,10,25,50,100].map(n => (
          <button key={n} onClick={() => apply(n)} disabled={saving} title={`Set to ${n}`}
            style={{...S.btnSmSec,padding:"5px 8px",fontSize:11,background:n===0?"#7f1d1d":n===100?"#14532d":"#1e293b",color:n===0?"#fca5a5":n===100?"#86efac":"#94a3b8"}}>
            ={n}
          </button>
        ))}
      </div>
      <button onClick={() => { setEditing(true); setVal(cur != null ? String(cur) : ""); }}
        style={{...S.btnSm,padding:"6px 10px",fontSize:11,background:"#0ea5e9"}}>
        ✏️ Manual
      </button>
      {saving && <span style={{fontSize:11,color:"#f59f00"}}>⏳</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span style={{borderRadius:8,padding:"4px 11px",fontSize:11,fontWeight:800,background:`${ST_COLOR[status]||"#94a3b8"}22`,color:ST_COLOR[status]||"#94a3b8"}}>{ST_LABEL[status]||status}</span>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState({deliveryFee:30,platformFee:5,taxRate:5,deliveryTime:8});
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const [pForm, setPForm] = useState(DEF_PROD);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [catForm, setCatForm] = useState(DEF_CAT);
  const [offerForm, setOfferForm] = useState(DEF_OFFER);
  const [bannerForm, setBannerForm] = useState(DEF_BANNER);

  const [pSearch, setPSearch] = useState("");
  const [pCatFilter, setPCatFilter] = useState("");
  const [oStatus, setOStatus] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const msg = (text, type = "ok") => { setStatus({text, type}); setTimeout(() => setStatus(null), 3200); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user || null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const login = async () => {
    if (!loginEmail || !loginPw) { setLoginErr("Email and password required"); return; }
    setLoginBusy(true); setLoginErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPw });
    setLoginBusy(false);
    if (error) { setLoginErr(error.message); return; }
    msg("✅ Logged in");
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  const loadProducts = useCallback(async () => { const { data } = await supabase.from("products").select("*").order("name"); if (data) setProducts(data); }, []);
  const loadCategories = useCallback(async () => { const { data } = await supabase.from("categories").select("*").order("name"); if (data) setCategories(data); }, []);
  const loadOrders = useCallback(async () => { const { data } = await supabase.from("orders").select("*").order("created_at", {ascending:false}); if (data) setOrders(data); }, []);
  const loadOffers = useCallback(async () => { const { data } = await supabase.from("offers").select("*").order("created_at", {ascending:false}); if (data) setOffers(data); }, []);
  const loadBanners = useCallback(async () => { const { data } = await supabase.from("banners").select("*").order("display_order"); if (data) setBanners(data); }, []);
  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("config").select("*").eq("key","settings").single();
    if (data?.value) { const v = data.value; setSettings({deliveryFee:v.deliveryFee??30,platformFee:v.platformFee??5,taxRate:v.taxRate??5,deliveryTime:v.deliveryTime??8}); }
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([loadProducts(), loadCategories(), loadOrders(), loadOffers(), loadBanners(), loadSettings()]);
    const subs = [];
    const sub = (t, fn) => supabase.channel(`a-${t}-${Math.random().toString(36).slice(2)}`).on("postgres_changes",{event:"*",schema:"public",table:t},fn).subscribe();
    subs.push(sub("products", loadProducts));
    subs.push(sub("orders", loadOrders));
    subs.push(sub("categories", loadCategories));
    subs.push(sub("offers", loadOffers));
    subs.push(sub("banners", loadBanners));
    subs.push(sub("config", loadSettings));
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [user, loadProducts, loadCategories, loadOrders, loadOffers, loadBanners, loadSettings]);

  const analytics = useMemo(() => ({
    totalProducts: products.length,
    totalOrders: orders.length,
    revenue: orders.filter(o => o.status !== "cancelled").reduce((s,o) => s + Number(o.total||0), 0),
    pending: orders.filter(o => o.status === "pending").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    outForDelivery: orders.filter(o => o.status === "out_for_delivery").length,
    lowStock: products.filter(p => Number(p.stock??999) > 0 && Number(p.stock??999) <= 10).length,
    outOfStock: products.filter(p => p.stock != null && Number(p.stock) === 0).length,
    categories: categories.length,
  }), [products, orders, categories]);

  const normProduct = (raw) => {
    const price = Number(raw.price || 0);
    const op = Number(raw.original_price || 0);
    const discount = raw.discount !== "" && raw.discount != null ? Number(raw.discount) : (op > price && op > 0 ? Math.round((op-price)/op*100) : 0);
    return { name:raw.name.trim(), category:raw.category.trim(), price, original_price:op||null, unit:raw.unit?.trim()||"piece", badge:raw.badge?.trim()||null, image:raw.image?.trim()||null, available:!!raw.available, discount, description:raw.description?.trim()||null, stock:raw.stock!==""&&raw.stock!=null?Number(raw.stock):null };
  };

  const saveProduct = async () => {
    if (!pForm.name.trim()) { alert("Product name is required."); return; }
    if (!pForm.category.trim()) { alert("Category is required."); return; }
    if (pForm.price === "" || isNaN(Number(pForm.price))) { alert("Valid price is required."); return; }
    const payload = normProduct(pForm);
    let error;
    if (editId) { ({ error } = await supabase.from("products").update(payload).eq("id", editId)); }
    else { ({ error } = await supabase.from("products").insert([payload])); }
    if (error) { alert(error.message); return; }
    msg(editId ? "✅ Product updated" : "✅ Product added");
    setPForm(DEF_PROD); setEditId(null); loadProducts();
  };

  const editProduct = (p) => {
    setEditId(p.id);
    setPForm({name:p.name||"",price:p.price??"",original_price:p.original_price??"",category:p.category||"",image:p.image||"",unit:p.unit||"piece",badge:p.badge||"",discount:p.discount??"",stock:p.stock??"",description:p.description||"",available:!!p.available});
    setTab("products"); window.scrollTo({top:0,behavior:"smooth"});
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    await supabase.from("products").delete().eq("id", id);
    msg("🗑️ Product deleted"); loadProducts();
  };

  const toggleAvail = async (p) => {
    await supabase.from("products").update({available: !p.available}).eq("id", p.id);
    msg(`✅ Product ${!p.available ? "shown" : "hidden"}`); loadProducts();
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file, {cacheControl:"3600",upsert:false});
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setPForm(p => ({...p, image: data.publicUrl}));
      msg("✅ Image uploaded");
    } catch(e) { alert(e.message || "Upload failed"); }
    setUploading(false);
  };

  const saveCat = async () => {
    if (!catForm.id.trim() || !catForm.name.trim()) { alert("ID and name required."); return; }
    const { error } = await supabase.from("categories").upsert([{id:catForm.id.trim(),name:catForm.name.trim(),emoji:catForm.emoji||null,color:catForm.color,bg:catForm.bg}]);
    if (error) { alert(error.message); return; }
    msg("✅ Category saved"); setCatForm(DEF_CAT); loadCategories();
  };
  const deleteCat = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    msg("🗑️ Category deleted"); loadCategories();
  };

  const updateOrderStatus = async (id, s) => {
    await supabase.from("orders").update({status: s}).eq("id", id);
    msg("✅ Order status updated"); loadOrders();
  };

  const saveSettings = async () => {
    const { error } = await supabase.from("config").upsert([{key:"settings",value:{deliveryFee:Number(settings.deliveryFee),platformFee:Number(settings.platformFee),taxRate:Number(settings.taxRate),deliveryTime:Number(settings.deliveryTime)}}]);
    if (error) { alert(error.message); return; }
    msg("✅ Settings saved — all users updated instantly!");
  };

  const saveOffer = async () => {
    if (!offerForm.code.trim() || !offerForm.discount) { alert("Code and discount required."); return; }
    const { error } = await supabase.from("offers").insert([{code:offerForm.code.toUpperCase().trim(),discount:Number(offerForm.discount),type:offerForm.type,min_order:Number(offerForm.min_order||0),description:offerForm.description||null,active:offerForm.active}]);
    if (error) { alert(error.message); return; }
    msg("✅ Offer created"); setOfferForm(DEF_OFFER); loadOffers();
  };
  const toggleOffer = async (id, active) => { await supabase.from("offers").update({active: !active}).eq("id", id); loadOffers(); };
  const deleteOffer = async (id) => { if (!window.confirm("Delete this offer?")) return; await supabase.from("offers").delete().eq("id", id); msg("🗑️ Offer deleted"); loadOffers(); };

  const saveBanner = async () => {
    if (!bannerForm.title.trim()) { alert("Title required."); return; }
    const { error } = await supabase.from("banners").insert([{title:bannerForm.title.trim(),subtitle:bannerForm.subtitle||null,bg:bannerForm.bg,active:bannerForm.active,display_order:banners.length}]);
    if (error) { alert(error.message); return; }
    msg("✅ Banner added"); setBannerForm(DEF_BANNER); loadBanners();
  };
  const toggleBanner = async (id, active) => { await supabase.from("banners").update({active: !active}).eq("id", id); loadBanners(); };
  const deleteBanner = async (id) => { if (!window.confirm("Delete banner?")) return; await supabase.from("banners").delete().eq("id", id); loadBanners(); };

  const filteredProducts = useMemo(() => products.filter(p => {
    const sm = !pSearch || `${p.name} ${p.category} ${p.badge||""}`.toLowerCase().includes(pSearch.toLowerCase());
    const cm = !pCatFilter || p.category === pCatFilter;
    const stm = stockFilter === "all" ? true : stockFilter === "low" ? (Number(p.stock??999) <= 10 && Number(p.stock??999) > 0) : stockFilter === "out" ? (p.stock != null && Number(p.stock) === 0) : true;
    return sm && cm && stm;
  }), [products, pSearch, pCatFilter, stockFilter]);

  const filteredOrders = useMemo(() => orders.filter(o => !oStatus || o.status === oStatus), [orders, oStatus]);

  if (loading) return (
    <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>⚡</div>
        <p style={{color:"#64748b",fontSize:14}}>Loading SAB-g Admin...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <h1 style={{margin:"0 0 4px",fontSize:36,fontWeight:900,letterSpacing:-1.5}}>SAB<span style={{color:"#22c55e"}}>-g</span></h1>
          <p style={{color:"#64748b",margin:0,fontSize:14,fontWeight:600,letterSpacing:0.5}}>ADMIN PANEL</p>
        </div>
        <div style={{...S.card,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}}>
          <h2 style={{...S.h2,marginBottom:20,fontSize:18}}>🔐 Admin Login</h2>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={S.label}>Admin Email</label>
              <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="admin@sabg.com" style={{...S.input,width:"100%",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input value={loginPw} onChange={e => setLoginPw(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key==="Enter" && login()} style={{...S.input,width:"100%",boxSizing:"border-box"}}/>
            </div>
            {loginErr && <p style={{margin:0,fontSize:12,color:"#ef4444",background:"#1e293b",borderRadius:8,padding:"9px 13px",fontWeight:600}}>{loginErr}</p>}
            <button onClick={login} disabled={loginBusy} style={{...S.btn,padding:"14px 0",fontSize:15,borderRadius:12,boxShadow:"0 6px 20px rgba(34,197,94,0.35)",opacity:loginBusy?0.7:1}}>
              {loginBusy ? "Logging in..." : "Login →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TABS = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"products",icon:"📦",label:"Products"},
    {id:"orders",icon:"🛵",label:"Orders",badge:analytics.pending},
    {id:"inventory",icon:"🔢",label:"Stock",badge:analytics.outOfStock},
    {id:"categories",icon:"🏷️",label:"Categories"},
    {id:"offers",icon:"🎁",label:"Offers"},
    {id:"banners",icon:"🖼️",label:"Banners"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-1.5,color:"#f1f5f9"}}>SAB<span style={{color:"#22c55e"}}>-g</span></h1>
            <p style={{margin:0,fontSize:11,color:"#64748b",marginTop:1}}>Admin · {user.email}</p>
          </div>
          <button onClick={logout} style={{...S.btnSec,padding:"8px 16px",fontSize:12}}>Logout</button>
        </div>
        {status && (
          <div style={{marginTop:12,padding:"10px 14px",background:"#0f2d1a",borderRadius:10,border:"1px solid #166534",fontSize:13,fontWeight:600,color:"#22c55e"}}>
            {status.text}
          </div>
        )}
      </div>

      <div style={{overflowX:"auto",scrollbarWidth:"none",borderBottom:"1px solid #1e293b",background:"#0f172a",position:"sticky",top:66,zIndex:90}}>
        <div style={{display:"flex",width:"max-content",minWidth:"100%"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{background:"none",border:"none",borderBottom:`3px solid ${tab===t.id?"#22c55e":"transparent"}`,color:tab===t.id?"#22c55e":"#64748b",padding:"11px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,transition:"color 0.2s",marginBottom:-1}}>
              <span>{t.icon}</span><span>{t.label}</span>
              {t.badge > 0 && <span style={{background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.badge > 99 ? "99+" : t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px 0"}}>

        {tab === "dashboard" && (
          <>
            <h2 style={S.h2}>📊 Overview</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:24}}>
              {[
                ["📦","Products",analytics.totalProducts,"#0ea5e9","products"],
                ["🛵","Total Orders",analytics.totalOrders,"#8b5cf6","orders"],
                ["💰","Revenue",`₹${analytics.revenue.toFixed(0)}`,{gradient:"#22c55e"},"orders"],
                ["⏳","Pending",analytics.pending,"#f59f00","orders"],
                ["✅","Delivered",analytics.delivered,"#22c55e","orders"],
                ["🛵","Out for Delivery",analytics.outForDelivery,"#f97316","orders"],
                ["⚠️","Low Stock (≤10)",analytics.lowStock,"#f59f00","inventory"],
                ["❌","Out of Stock",analytics.outOfStock,"#ef4444","inventory"],
                ["🏷️","Categories",analytics.categories,"#a78bfa","categories"],
              ].map(([icon,title,val,color,link]) => (
                <div key={title} style={{...S.card,display:"flex",flexDirection:"column",gap:4,cursor:"pointer"}} onClick={() => setTab(link)}>
                  <span style={{fontSize:24}}>{icon}</span>
                  <p style={{margin:0,fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.5}}>{title.toUpperCase()}</p>
                  <p style={{margin:0,fontSize:26,fontWeight:900,color:typeof color==="string"?color:"#22c55e"}}>{val}</p>
                </div>
              ))}
            </div>

            <h2 style={S.h2}>Recent Orders</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {orders.slice(0,5).map(o => (
                <div key={o.id} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div>
                    <p style={{margin:"0 0 2px",fontFamily:"monospace",fontSize:12,color:"#f1f5f9",fontWeight:800}}>#{String(o.id).slice(-8).toUpperCase()}</p>
                    <p style={{margin:0,fontSize:11,color:"#64748b"}}>{new Date(o.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <StatusBadge status={o.status}/>
                    <span style={{fontWeight:900,color:"#22c55e",fontSize:15}}>₹{o.total}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"24px 0"}}>No orders yet</p>}
            </div>

            {(analytics.outOfStock > 0 || analytics.lowStock > 0) && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h2 style={{...S.h2,margin:0,color:"#f59f00"}}>⚠️ Stock Alerts</h2>
                  <button onClick={() => setTab("inventory")} style={{...S.btnSm,background:"#f59f00",color:"#0f172a",fontSize:11}}>View All</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {products.filter(p => Number(p.stock??999) <= 10).slice(0,5).map(p => (
                    <div key={p.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,borderColor:Number(p.stock||0)===0?"#ef4444":"#f59f00"}}>
                      <div style={{background:"#0f172a",borderRadius:10,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {p.image?.startsWith("http") ? <img src={p.image} alt="" style={{width:34,height:34,objectFit:"contain",borderRadius:6}}/> : <span style={{fontSize:26}}>{p.image||"🛒"}</span>}
                      </div>
                      <div style={{flex:1}}>
                        <p style={{margin:"0 0 4px",fontWeight:700,fontSize:13,color:"#f1f5f9"}}>{p.name}</p>
                        <StockPill stock={p.stock}/>
                      </div>
                      <StockControl product={p} onSave={loadProducts}/>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === "products" && (
          <>
            <div style={{...S.card,marginBottom:20,border:`1px solid ${editId?"#22c55e":"#334155"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={S.h2}>{editId ? "✏️ Edit Product" : "➕ Add New Product"}</h2>
                {editId && <button onClick={() => { setPForm(DEF_PROD); setEditId(null); }} style={S.btnSec}>✕ Cancel</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {[["name","Product Name *"],["price","Price (₹) *"],["original_price","Original Price (₹)"],["unit","Unit (kg/piece/litre)"],["badge","Badge (e.g. HOT, NEW)"],["discount","Discount %"]].map(([k,ph]) => (
                  <div key={k}>
                    <label style={S.label}>{ph}</label>
                    <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder={ph} value={pForm[k]} onChange={e => setPForm(p => ({...p,[k]:e.target.value}))}/>
                  </div>
                ))}
                <div>
                  <label style={S.label}>Category *</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="Select or type..." value={pForm.category} onChange={e => setPForm(p => ({...p,category:e.target.value}))} list="cat-list"/>
                  <datalist id="cat-list">{categories.map(c => <option key={c.id} value={c.name}/>)}</datalist>
                </div>
                <div>
                  <label style={S.label}>Items in Stock (blank = unlimited)</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="e.g. 50" value={pForm.stock} onChange={e => setPForm(p => ({...p,stock:e.target.value}))} type="number" min="0"/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={S.label}>Image URL or Emoji</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="https://... or 🍎" value={pForm.image} onChange={e => setPForm(p => ({...p,image:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={S.label}>Description</label>
                  <textarea style={{...S.input,width:"100%",boxSizing:"border-box",minHeight:70,resize:"vertical"}} placeholder="Product description..." value={pForm.description} onChange={e => setPForm(p => ({...p,description:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16,marginTop:14,flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:"#f1f5f9",fontSize:13,fontWeight:600}}>
                  <input type="checkbox" checked={pForm.available} onChange={e => setPForm(p => ({...p,available:e.target.checked}))} style={{width:16,height:16}}/>
                  Available in App
                </label>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <label style={{...S.label,margin:0}}>Upload Image:</label>
                  <input type="file" accept="image/*" onChange={e => uploadImage(e.target.files?.[0])} style={{color:"#64748b",fontSize:12}}/>
                  {uploading && <span style={{fontSize:12,color:"#f59f00"}}>⏳ Uploading...</span>}
                </div>
              </div>
              {pForm.image && (
                <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10}}>
                  {pForm.image.startsWith("http") ? <img src={pForm.image} alt="" style={{width:64,height:64,objectFit:"contain",borderRadius:12,background:"#0f172a",border:"1px solid #334155"}}/> : <span style={{fontSize:50}}>{pForm.image}</span>}
                  <span style={{fontSize:12,color:"#64748b"}}>Image Preview</span>
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <button onClick={saveProduct} style={{...S.btn,minWidth:150}}>{editId ? "Update Product" : "Add Product"}</button>
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <input style={{...S.input,flex:1,minWidth:140}} placeholder="🔍 Search products..." value={pSearch} onChange={e => setPSearch(e.target.value)}/>
              <select style={{...S.input,minWidth:140}} value={pCatFilter} onChange={e => setPCatFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select style={{...S.input,minWidth:130}} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
                <option value="all">All Stock</option>
                <option value="low">Low Stock (≤10)</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <h2 style={S.h2}>Products ({filteredProducts.length})</h2>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredProducts.map(p => (
                <div key={p.id} style={{...S.card,display:"flex",gap:14,flexWrap:"wrap",borderLeft:`3px solid ${!p.available?"#ef4444":Number(p.stock||999)===0?"#ef4444":Number(p.stock||999)<=10?"#f97316":"#334155"}`}}>
                  <div style={{background:"#0f172a",borderRadius:10,width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {p.image?.startsWith("http") ? <img src={p.image} alt={p.name} style={{width:52,height:52,objectFit:"contain",borderRadius:8}}/> : <span style={{fontSize:36}}>{p.image||"🛒"}</span>}
                  </div>
                  <div style={{flex:1,minWidth:140}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <h3 style={{margin:0,fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{p.name}</h3>
                      {!p.available && <span style={{background:"#fef2f2",color:"#ef4444",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:800}}>HIDDEN</span>}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                      <span style={{color:"#94a3b8",fontSize:12}}>{p.category}</span>
                      <span style={{color:"#22c55e",fontWeight:700,fontSize:13}}>₹{p.price}</span>
                      {p.original_price && <span style={{color:"#64748b",fontSize:12,textDecoration:"line-through"}}>₹{p.original_price}</span>}
                      {p.badge && <span style={{background:"#1e3a5f",color:"#7dd3fc",borderRadius:6,padding:"1px 8px",fontSize:10,fontWeight:700}}>{p.badge}</span>}
                    </div>
                    <div>
                      <p style={{margin:"0 0 7px",fontSize:10,color:"#64748b",fontWeight:700,letterSpacing:0.5}}>ITEMS IN STOCK</p>
                      <StockControl product={p} onSave={loadProducts}/>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",justifyContent:"flex-start"}}>
                    <button onClick={() => editProduct(p)} style={S.btnSm}>✏️ Edit</button>
                    <button onClick={() => toggleAvail(p)} style={{...S.btnSmSec,color:p.available?"#f1f5f9":"#22c55e"}}>{p.available ? "🙈 Hide" : "👁️ Show"}</button>
                    <button onClick={() => deleteProduct(p.id)} style={S.btnSmDanger}>🗑️</button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"32px 0"}}>No products found</p>}
            </div>
          </>
        )}

        {tab === "inventory" && (
          <>
            <h2 style={S.h2}>📦 Stock Management</h2>
            <p style={{color:"#64748b",fontSize:13,marginTop:-8,marginBottom:16,lineHeight:1.5}}>
              Use <strong style={{color:"#ef4444"}}>−</strong>/<strong style={{color:"#22c55e"}}>+</strong> for quick adjustments · preset buttons to bulk-set · <strong style={{color:"#0ea5e9"}}>✏️ Manual</strong> for exact value. Changes sync in real-time to all customers.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {[
                ["🟢","In Stock",products.filter(p => Number(p.stock??999) > 30 || p.stock == null).length,"#22c55e","all"],
                ["🟡","Low (1–30)",products.filter(p => Number(p.stock??999) > 0 && Number(p.stock??999) <= 30).length,"#eab308","low"],
                ["🔴","Out of Stock",products.filter(p => p.stock != null && Number(p.stock) === 0).length,"#ef4444","out"],
              ].map(([icon,label,val,color,filter]) => (
                <div key={label} style={{...S.card,textAlign:"center",cursor:"pointer"}} onClick={() => setStockFilter(filter)}>
                  <span style={{fontSize:28}}>{icon}</span>
                  <p style={{margin:"6px 0 2px",fontSize:10,color:"#64748b",fontWeight:700}}>{label.toUpperCase()}</p>
                  <p style={{margin:0,fontSize:28,fontWeight:900,color}}>{val}</p>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <input style={{...S.input,flex:1}} placeholder="🔍 Search products..." value={pSearch} onChange={e => setPSearch(e.target.value)}/>
              <select style={{...S.input,minWidth:140}} value={pCatFilter} onChange={e => setPCatFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <div style={{display:"flex",gap:6}}>
                {[["all","All"],["low","Low"],["out","Out"]].map(([v,l]) => (
                  <button key={v} onClick={() => setStockFilter(v)}
                    style={{...stockFilter===v?S.btn:S.btnSec,padding:"9px 14px",fontSize:12,background:stockFilter===v?(v==="out"?"#ef4444":v==="low"?"#f59f00":"#22c55e"):S.btnSec.background}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredProducts.map(p => (
                <div key={p.id} style={{...S.card,border:`1px solid ${p.stock!=null&&Number(p.stock)===0?"#ef444440":Number(p.stock||999)<=10&&p.stock!=null?"#f9731640":"#334155"}`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div style={{background:"#0f172a",borderRadius:10,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {p.image?.startsWith("http") ? <img src={p.image} alt="" style={{width:42,height:42,objectFit:"contain"}}/> : <span style={{fontSize:28}}>{p.image||"🛒"}</span>}
                    </div>
                    <div style={{flex:1,minWidth:160}}>
                      <p style={{margin:"0 0 2px",fontWeight:800,fontSize:14,color:"#f1f5f9"}}>{p.name}</p>
                      <p style={{margin:"0 0 10px",fontSize:11,color:"#64748b"}}>{p.category} · ₹{p.price}/{p.unit}</p>
                      <StockControl product={p} onSave={loadProducts}/>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"32px 0"}}>No products match your filter</p>}
            </div>
          </>
        )}

        {tab === "orders" && (
          <>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <h2 style={{...S.h2,margin:0,flex:1}}>Orders ({filteredOrders.length})</h2>
              <select style={{...S.input,minWidth:180}} value={oStatus} onChange={e => setOStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{ST_LABEL[s]}</option>)}
              </select>
            </div>
            {analytics.pending > 0 && (
              <div style={{background:"#fef3c7",border:"1px solid #f59f00",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,fontWeight:700,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>
                ⏳ {analytics.pending} order{analytics.pending !== 1 ? "s" : ""} waiting for confirmation!
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filteredOrders.map(o => (
                <div key={o.id} style={{...S.card,borderLeft:`3px solid ${ST_COLOR[o.status]||"#334155"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <div>
                      <p style={{margin:"0 0 2px",fontFamily:"monospace",fontSize:13,color:"#f1f5f9",fontWeight:900}}>#{String(o.id).slice(-8).toUpperCase()}</p>
                      <p style={{margin:0,fontSize:11,color:"#64748b"}}>{new Date(o.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <StatusBadge status={o.status}/>
                      <span style={{fontWeight:900,color:"#22c55e",fontSize:17}}>₹{o.total}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                    {[["📍",o.address],["🕐",o.delivery_slot],["💵",o.payment_method]].filter(([,v]) => v).map(([icon,val]) => (
                      <span key={icon} style={{fontSize:12,color:"#94a3b8",background:"#0f172a",borderRadius:8,padding:"4px 10px",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{icon} {val}</span>
                    ))}
                  </div>
                  <div style={{marginBottom:12}}>
                    <button onClick={() => setExpandedOrder(expandedOrder===o.id ? null : o.id)}
                      style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,padding:"4px 0",display:"flex",alignItems:"center",gap:6}}>
                      {expandedOrder===o.id ? "▲" : "▼"} {(o.items||[]).length} item{(o.items||[]).length!==1?"s":""} · ₹{o.total}
                    </button>
                    {expandedOrder === o.id && (
                      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4,paddingLeft:4}}>
                        {(o.items||[]).map((item,i) => (
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#94a3b8",padding:"5px 0",borderBottom:"1px solid #1e293b"}}>
                            <span>{item.name} <span style={{color:"#64748b"}}>× {item.quantity}</span></span>
                            <span style={{fontWeight:700,color:"#f1f5f9"}}>₹{item.total}</span>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"flex-end",paddingTop:6,fontSize:13,fontWeight:900,color:"#22c55e"}}>Total: ₹{o.total}</div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={S.label}>Update Status</label>
                    <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                      style={{...S.input,width:"100%",boxSizing:"border-box",borderColor:ST_COLOR[o.status]||"#334155"}}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{ST_LABEL[s]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"32px 0"}}>No orders found</p>}
            </div>
          </>
        )}

        {tab === "categories" && (
          <>
            <div style={{...S.card,marginBottom:20}}>
              <h2 style={S.h2}>Add / Edit Category</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {[["id","Category ID (slug)"],["name","Display Name"],["emoji","Emoji Icon"],["color","Text/Border Color"],["bg","Background Color"]].map(([k,ph]) => (
                  <div key={k}>
                    <label style={S.label}>{ph}</label>
                    <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder={ph} value={catForm[k]} onChange={e => setCatForm(p => ({...p,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              {catForm.name && (
                <div style={{marginTop:14,display:"flex",alignItems:"center",gap:12,background:"#0f172a",borderRadius:12,padding:"12px 16px"}}>
                  <div style={{width:52,height:52,background:catForm.bg||"#f0fdf4",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:`2px solid ${catForm.color||"#22c55e"}`}}>{catForm.emoji||"🏷️"}</div>
                  <div><p style={{margin:"0 0 2px",fontWeight:700,color:"#f1f5f9"}}>{catForm.name}</p><p style={{margin:0,fontSize:11,color:"#64748b"}}>Preview · ID: {catForm.id||"—"}</p></div>
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={saveCat} style={S.btn}>Save Category</button>
                <button onClick={() => setCatForm(DEF_CAT)} style={S.btnSec}>Reset</button>
              </div>
            </div>
            <h2 style={S.h2}>Categories ({categories.length})</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {categories.map(c => (
                <div key={c.id} style={{...S.card,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,background:c.bg||"#1e293b",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${c.color||"#334155"}`}}>{c.emoji||"🏷️"}</div>
                  <div style={{flex:1}}>
                    <p style={{margin:"0 0 2px",fontWeight:800,fontSize:14,color:"#f1f5f9"}}>{c.name}</p>
                    <p style={{margin:0,fontSize:11,color:"#64748b"}}>ID: {c.id} · {c.color}</p>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={() => setCatForm({id:c.id,name:c.name,emoji:c.emoji||"",color:c.color||"#22c55e",bg:c.bg||"#f0fdf4"})} style={S.btnSm}>Edit</button>
                    <button onClick={() => deleteCat(c.id)} style={S.btnSmDanger}>Delete</button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"24px 0"}}>No categories yet</p>}
            </div>
          </>
        )}

        {tab === "offers" && (
          <>
            <div style={{...S.card,marginBottom:20}}>
              <h2 style={S.h2}>Create Promo Code</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                <div>
                  <label style={S.label}>Promo Code</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box",letterSpacing:2,fontWeight:700}} placeholder="SAVE20" value={offerForm.code} onChange={e => setOfferForm(p => ({...p,code:e.target.value.toUpperCase()}))}/>
                </div>
                <div>
                  <label style={S.label}>Discount Value</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="20" type="number" value={offerForm.discount} onChange={e => setOfferForm(p => ({...p,discount:e.target.value}))}/>
                </div>
                <div>
                  <label style={S.label}>Type</label>
                  <select style={{...S.input,width:"100%",boxSizing:"border-box"}} value={offerForm.type} onChange={e => setOfferForm(p => ({...p,type:e.target.value}))}>
                    <option value="percent">% Percentage Off</option>
                    <option value="flat">₹ Flat Amount Off</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Min Order Value (₹)</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="0" type="number" value={offerForm.min_order} onChange={e => setOfferForm(p => ({...p,min_order:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={S.label}>Description (optional)</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="Get 20% off on all items" value={offerForm.description} onChange={e => setOfferForm(p => ({...p,description:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:"flex",gap:14,marginTop:16,alignItems:"center"}}>
                <button onClick={saveOffer} style={S.btn}>Create Offer</button>
                <label style={{display:"flex",alignItems:"center",gap:6,color:"#f1f5f9",fontSize:13,cursor:"pointer",fontWeight:600}}>
                  <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm(p => ({...p,active:e.target.checked}))} style={{width:16,height:16}}/>
                  Active immediately
                </label>
              </div>
            </div>
            <h2 style={S.h2}>Promo Codes ({offers.length})</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {offers.map(o => (
                <div key={o.id} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div>
                    <p style={{margin:"0 0 3px",fontWeight:900,fontSize:18,color:"#22c55e",fontFamily:"monospace",letterSpacing:1}}>{o.code}</p>
                    <p style={{margin:"0 0 2px",fontSize:13,color:"#94a3b8"}}>{o.type==="percent"?`${o.discount}% off`:`₹${o.discount} off`} · Min ₹{o.min_order||0}</p>
                    {o.description && <p style={{margin:0,fontSize:12,color:"#64748b"}}>{o.description}</p>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{borderRadius:8,padding:"4px 11px",fontSize:11,fontWeight:800,background:o.active?"#f0fdf420":"#1e293b",color:o.active?"#22c55e":"#64748b"}}>{o.active?"Active":"Inactive"}</span>
                    <button onClick={() => toggleOffer(o.id, o.active)} style={S.btnSmSec}>{o.active?"Disable":"Enable"}</button>
                    <button onClick={() => deleteOffer(o.id)} style={S.btnSmDanger}>Delete</button>
                  </div>
                </div>
              ))}
              {offers.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"24px 0"}}>No promo codes yet</p>}
            </div>
          </>
        )}

        {tab === "banners" && (
          <>
            <div style={{...S.card,marginBottom:20}}>
              <h2 style={S.h2}>Add Banner</h2>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={S.label}>Banner Title</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="Flash Sale! 🔥" value={bannerForm.title} onChange={e => setBannerForm(p => ({...p,title:e.target.value}))}/>
                </div>
                <div>
                  <label style={S.label}>Subtitle</label>
                  <input style={{...S.input,width:"100%",boxSizing:"border-box"}} placeholder="Up to 40% off on fresh fruits" value={bannerForm.subtitle} onChange={e => setBannerForm(p => ({...p,subtitle:e.target.value}))}/>
                </div>
                <div>
                  <label style={S.label}>Background Gradient</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
                    {GRADIENTS.map(g => <div key={g} onClick={() => setBannerForm(p => ({...p,bg:g}))} style={{width:46,height:46,background:g,borderRadius:12,cursor:"pointer",border:bannerForm.bg===g?"3px solid #fff":"3px solid transparent",boxShadow:bannerForm.bg===g?"0 0 0 3px #22c55e":"none"}}/>)}
                  </div>
                </div>
                {bannerForm.title && (
                  <div style={{background:bannerForm.bg,borderRadius:14,padding:"16px 20px"}}>
                    {bannerForm.subtitle && <p style={{margin:"0 0 4px",color:"rgba(255,255,255,0.8)",fontSize:11}}>{bannerForm.subtitle}</p>}
                    <p style={{margin:0,color:"#fff",fontSize:18,fontWeight:900}}>{bannerForm.title}</p>
                  </div>
                )}
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <button onClick={saveBanner} style={S.btn}>Add Banner</button>
                  <label style={{display:"flex",alignItems:"center",gap:6,color:"#f1f5f9",fontSize:13,cursor:"pointer",fontWeight:600}}>
                    <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm(p => ({...p,active:e.target.checked}))} style={{width:16,height:16}}/>
                    Show on App
                  </label>
                </div>
              </div>
            </div>
            <h2 style={S.h2}>Banners ({banners.length})</h2>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {banners.map(b => (
                <div key={b.id} style={S.card}>
                  <div style={{background:b.bg,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                    {b.subtitle && <p style={{margin:"0 0 3px",color:"rgba(255,255,255,0.8)",fontSize:11}}>{b.subtitle}</p>}
                    <p style={{margin:0,color:"#fff",fontSize:16,fontWeight:800}}>{b.title}</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{borderRadius:8,padding:"4px 11px",fontSize:11,fontWeight:800,background:b.active?"#f0fdf420":"#1e293b",color:b.active?"#22c55e":"#64748b"}}>{b.active?"Visible on App":"Hidden"}</span>
                    <button onClick={() => toggleBanner(b.id, b.active)} style={S.btnSmSec}>{b.active?"Hide":"Show"}</button>
                    <button onClick={() => deleteBanner(b.id)} style={S.btnSmDanger}>Delete</button>
                  </div>
                </div>
              ))}
              {banners.length === 0 && <p style={{color:"#64748b",textAlign:"center",padding:"24px 0"}}>No banners yet</p>}
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            <div style={{...S.card,marginBottom:16}}>
              <h2 style={S.h2}>⚙️ App Settings</h2>
              <p style={{margin:"0 0 20px",fontSize:13,color:"#64748b",lineHeight:1.7}}>
                Changes sync instantly to <strong style={{color:"#22c55e"}}>all users</strong> in real-time via Supabase Realtime. No app restart needed.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                {[["deliveryFee","🚴 Delivery Fee (₹)","Charged per order"],["platformFee","🏷️ Platform Fee (₹)","Handling charge"],["taxRate","📊 Tax Rate (%)","Applied on subtotal"],["deliveryTime","⏱️ Delivery Time (mins)","Shown to customers"]].map(([k,label,hint]) => (
                  <div key={k}>
                    <label style={S.label}>{label}</label>
                    <input style={{...S.input,width:"100%",boxSizing:"border-box",fontSize:17,fontWeight:700}} type="number" min="0" value={settings[k]} onChange={e => setSettings(p => ({...p,[k]:e.target.value}))}/>
                    <p style={{margin:"5px 0 0",fontSize:11,color:"#64748b"}}>{hint}</p>
                  </div>
                ))}
              </div>
              <button onClick={saveSettings} style={{...S.btn,marginTop:22,padding:"14px 32px",fontSize:14}}>💾 Save & Push to All Users</button>
            </div>
            <div style={{...S.card,background:"#0f2d1a",border:"1px solid #166534"}}>
              <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:800,color:"#22c55e"}}>💡 Real-time Settings Flow</h3>
              <p style={{margin:0,fontSize:13,color:"#4ade80",lineHeight:1.7}}>
                Save → writes to <code style={{background:"#1e293b",borderRadius:4,padding:"1px 6px"}}>config</code> table → Supabase broadcasts to all subscribed customers → delivery fee, tax, and time update instantly for everyone without refresh.
              </p>
            </div>
          </>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { display: none; }
        input, select, textarea, button { font-family: inherit; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
      `}</style>
    </div>
  );
}
