"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, CalendarDays, CircleDollarSign, Star, Users, CheckCircle2, XCircle, Clock3, Sparkles, RefreshCw } from "lucide-react";

type Booking = { id:string; bride_id:string|null; service_id:string|null; booking_date:string|null; created_at:string|null; status:string|null; completed_by_mua:boolean|null; mua_payout:number|null; service_price:number|null; platform_fee:number|null; mua_completed_at:string|null; cancelled_by:string|null };
type Service = { id:string; name:string };
type Review = { rating:number|null; created_at:string|null };
const money=(v:number)=>`EGP ${Math.round(v).toLocaleString("en-EG")}`;
const monthKey=(d:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit"}).format(d);
const monthLabel=(d:Date)=>new Intl.DateTimeFormat("en",{timeZone:"Africa/Cairo",month:"short"}).format(d);

export default function MuaPerformancePage(){
 const [bookings,setBookings]=useState<Booking[]>([]),[services,setServices]=useState<Service[]>([]),[reviews,setReviews]=useState<Review[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const loadData=useCallback(async()=>{
  setLoading(true);setError(null);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setBookings([]);setServices([]);setReviews([]);setLoading(false);setError("Please sign in to view your performance.");return;}
  const [b,s,r]=await Promise.all([
   supabase.from("bookings").select("id, bride_id, service_id, booking_date, created_at, status, completed_by_mua, mua_payout, service_price, platform_fee, mua_completed_at, cancelled_by").eq("mua_id",user.id).order("created_at",{ascending:false}),
   supabase.from("mua_services").select("id,name").eq("mua_id",user.id),
   supabase.from("mua_reviews").select("rating,created_at").eq("mua_id",user.id)
  ]);
  const failures=[b.error&&`Bookings: ${b.error.message}`,s.error&&`Services: ${s.error.message}`,r.error&&`Reviews: ${r.error.message}`].filter(Boolean) as string[];
  if(failures.length)setError(failures.join(" · "));
  setBookings((b.data||[]) as Booking[]);setServices((s.data||[]) as Service[]);setReviews((r.data||[]) as Review[]);setLoading(false);
 },[]);
 useEffect(()=>{void loadData();const ch=supabase.channel("mua-performance-insights").on("postgres_changes",{event:"*",schema:"public",table:"bookings"},()=>void loadData()).on("postgres_changes",{event:"*",schema:"public",table:"mua_reviews"},()=>void loadData()).on("postgres_changes",{event:"*",schema:"public",table:"mua_services"},()=>void loadData()).subscribe();return()=>{void supabase.removeChannel(ch)};},[loadData]);
 const stats=useMemo(()=>{
  const completed=bookings.filter(b=>b.completed_by_mua===true||(b.status||"").toLowerCase()==="completed");
  const cancelled=bookings.filter(b=>(b.status||"").toLowerCase()==="cancelled"||!!b.cancelled_by);
  const pending=bookings.filter(b=>["pending","confirmed_payment_pending"].includes((b.status||"").toLowerCase()));
  const earnings=completed.reduce((sum,b)=>sum+(b.mua_payout==null?Math.max(Number(b.service_price||0)-Number(b.platform_fee??Math.round(Number(b.service_price||0)*.1)),0):Math.max(Number(b.mua_payout),0)),0);
  const clients=new Map<string,number>();bookings.forEach(b=>{if(b.bride_id)clients.set(b.bride_id,(clients.get(b.bride_id)||0)+1)});
  const ratings=reviews.map(r=>Number(r.rating)).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
  return {total:bookings.length,completed:completed.length,cancelled:cancelled.length,pending:pending.length,earnings,repeat:[...clients.values()].filter(n=>n>1).length,ratings,average:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0};
 },[bookings,reviews]);
 const trend=useMemo(()=>{
  const now=new Date();const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);return {key:monthKey(d),label:monthLabel(d),bookings:0,revenue:0}});
  const map=new Map(months.map(m=>[m.key,m]));
  bookings.forEach(b=>{const key=b.booking_date?.slice(0,7)||(b.created_at?monthKey(new Date(b.created_at)):"");const m=map.get(key);if(!m)return;m.bookings++;if(b.completed_by_mua||(b.status||"").toLowerCase()==="completed")m.revenue+=b.mua_payout==null?Math.max(Number(b.service_price||0)-Number(b.platform_fee??Math.round(Number(b.service_price||0)*.1)),0):Math.max(Number(b.mua_payout),0)});
  return months;
 },[bookings]);
 const popular=useMemo(()=>{const counts=new Map<string,number>();bookings.forEach(b=>{if(b.service_id)counts.set(b.service_id,(counts.get(b.service_id)||0)+1)});const names=new Map(services.map(s=>[s.id,s.name]));return [...counts].map(([id,count])=>({name:names.get(id)||"Service",count})).sort((a,b)=>b.count-a.count).slice(0,5)},[bookings,services]);
 const maxB=Math.max(...trend.map(m=>m.bookings),1),maxR=Math.max(...trend.map(m=>m.revenue),1);
 const breakdown=[5,4,3,2,1].map(stars=>({stars,count:stats.ratings.filter(n=>Math.round(n)===stars).length}));
 return <main className="mx-auto max-w-7xl space-y-6 text-[#171018]">
  <header className="rounded-[2rem] border border-[#eadff5] bg-gradient-to-br from-[#fff8fc] via-white to-[#f8f2ff] p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-purple-700">Beaura · Your business</p><h1 className="mt-3 text-3xl font-light tracking-[-0.06em] sm:text-4xl">My performance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6077]">Understand your bookings, earnings, services and client feedback in one place.</p></div><button onClick={()=>void loadData()} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-[#eadff5] bg-white px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw size={15} className={loading?"animate-spin":""}/>Refresh</button></div></header>
  {error&&<div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   <Stat label="Total bookings" value={loading?"…":String(stats.total)} detail="All bookings on your account" icon={<CalendarDays size={18}/>}/>
   <Stat label="Completed" value={loading?"…":String(stats.completed)} detail="Appointments marked complete" icon={<CheckCircle2 size={18}/>}/>
   <Stat label="Total earned" value={loading?"…":money(stats.earnings)} detail="Payout from completed bookings" icon={<CircleDollarSign size={18}/>}/>
   <Stat label="Repeat clients" value={loading?"…":String(stats.repeat)} detail="Clients who booked more than once" icon={<Users size={18}/>}/>
  </section>
  <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
   <Panel><div className="flex items-center gap-2"><TrendingUp size={17} className="text-purple-700"/><h2 className="text-xl font-medium">Booking & revenue trends</h2></div><p className="mt-1 text-xs text-[#817386]">Last six months · revenue from completed bookings</p>
    <div className="mt-6 space-y-6"><div><p className="mb-3 text-xs font-medium text-[#6f6077]">Bookings</p><div className="grid grid-cols-6 gap-2">{trend.map(m=><div key={m.key} className="flex flex-col items-center gap-2"><div className="flex h-28 w-full items-end rounded-xl bg-[#faf7ff] p-1"><div title={String(m.bookings)} className="w-full rounded-t-md bg-purple-400" style={{height:`${m.bookings?Math.max(m.bookings/maxB*100,7):0}%`}}/></div><span className="text-[10px] text-[#817386]">{m.label}</span><span className="text-xs font-medium">{m.bookings}</span></div>)}</div></div>
    <div><p className="mb-3 text-xs font-medium text-[#6f6077]">Completed-booking revenue</p><div className="grid grid-cols-6 gap-2">{trend.map(m=><div key={m.key} className="flex flex-col items-center gap-2"><div className="flex h-28 w-full items-end rounded-xl bg-[#fff8fc] p-1"><div title={money(m.revenue)} className="w-full rounded-t-md bg-pink-300" style={{height:`${m.revenue?Math.max(m.revenue/maxR*100,7):0}%`}}/></div><span className="text-[10px] text-[#817386]">{m.label}</span><span className="text-[9px] font-medium">{m.revenue?money(m.revenue):"—"}</span></div>)}</div></div></div>
   </Panel>
   <Panel><div className="flex items-center gap-2"><Star size={17} className="text-purple-700"/><h2 className="text-xl font-medium">Client reviews</h2></div><div className="mt-5 flex items-end gap-3"><span className="text-4xl font-light">{stats.ratings.length?stats.average.toFixed(1):"—"}</span><div className="pb-1"><div className="flex gap-0.5 text-amber-400">{[1,2,3,4,5].map(n=><Star key={n} size={14} fill={n<=Math.round(stats.average)&&stats.ratings.length?"currentColor":"none"}/>)}</div><p className="mt-1 text-xs text-[#817386]">{stats.ratings.length} ratings</p></div></div><div className="mt-5 space-y-3">{breakdown.map(x=><div key={x.stars} className="flex items-center gap-3 text-xs"><span className="w-8 text-[#6f6077]">{x.stars} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0eaf4]"><div className="h-full rounded-full bg-amber-300" style={{width:`${stats.ratings.length?x.count/stats.ratings.length*100:0}%`}}/></div><span className="w-5 text-right text-[#817386]">{x.count}</span></div>)}</div>{!stats.ratings.length&&<p className="mt-4 text-xs text-[#817386]">Ratings will appear here after clients review completed bookings.</p>}</Panel>
  </section>
  <section className="grid gap-5 xl:grid-cols-2">
   <Panel><div className="flex items-center gap-2"><Sparkles size={17} className="text-purple-700"/><h2 className="text-xl font-medium">Most-booked services</h2></div><p className="mt-1 text-xs text-[#817386]">Ranked by bookings received</p>{popular.length?<div className="mt-5 space-y-4">{popular.map((x,i)=><div key={x.name} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f7efff] text-xs font-semibold text-purple-700">{i+1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{x.name}</span><span className="text-[#817386]">{x.count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0eaf4]"><div className="h-full rounded-full bg-purple-300" style={{width:`${x.count/popular[0].count*100}%`}}/></div></div></div>)}</div>:<Empty text="Your service ranking will appear once you receive bookings."/>}</Panel>
   <Panel><div className="flex items-center gap-2"><CalendarDays size={17} className="text-purple-700"/><h2 className="text-xl font-medium">Booking outcomes</h2></div><p className="mt-1 text-xs text-[#817386]">A quick view of your booking statuses</p><div className="mt-5 grid grid-cols-2 gap-3"><Outcome label="Completed" value={stats.completed} icon={<CheckCircle2 size={16}/>}/><Outcome label="Cancelled" value={stats.cancelled} icon={<XCircle size={16}/>}/><Outcome label="Awaiting action" value={stats.pending} icon={<Clock3 size={16}/>}/><Outcome label="Repeat clients" value={stats.repeat} icon={<Users size={16}/>}/></div><p className="mt-4 text-xs leading-5 text-[#817386]">Repeat clients are counted when the same client has booked you more than once. Cancelled includes cancelled status or a recorded cancellation actor.</p></Panel>
  </section>
 </main>;
}
function Panel({children}:{children:React.ReactNode}){return <section className="rounded-[1.7rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-6">{children}</section>}
function Stat({label,value,detail,icon}:{label:string;value:string;detail:string;icon:React.ReactNode}){return <div className="rounded-[1.5rem] border border-[#eadff5] bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-xs text-[#817386]"><span>{label}</span><span className="text-purple-700">{icon}</span></div><p className="mt-3 text-2xl font-light tabular-nums">{value}</p><p className="mt-1 text-xs text-[#817386]">{detail}</p></div>}
function Outcome({label,value,icon}:{label:string;value:number;icon:React.ReactNode}){return <div className="rounded-xl bg-[#fffafc] p-4"><div className="flex items-center gap-2 text-xs text-[#817386]">{icon}{label}</div><p className="mt-2 text-2xl font-light tabular-nums">{value}</p></div>}
function Empty({text}:{text:string}){return <div className="mt-5 rounded-xl border border-dashed border-[#eadff5] bg-[#fffafc] px-4 py-8 text-center text-sm text-[#817386]">{text}</div>}
