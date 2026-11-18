"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Transfer = { id:string; booking_id:string; mua_id:string; amount:number; status:string; created_at:string; transfer_reference:string|null; bride_funded_amount:number|null; beaura_funded_amount:number|null };
type Booking = { id:string; booking_date:string; booking_time:string; travel_fee:number|null; location:string|null };
type Artist = { id:string; first_name:string|null; last_name:string|null };

export default function PendingDepositsPage() {
  const [items,setItems]=useState<Transfer[]>([]);
  const [bookings,setBookings]=useState<Record<string,Booking>>({});
  const [artists,setArtists]=useState<Record<string,Artist>>({});
  const [refs,setRefs]=useState<Record<string,string>>({});
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true); setError(null);
    const {data,error:loadError}=await supabase.from("booking_deposit_transfers")
      .select("id,booking_id,mua_id,amount,status,created_at,transfer_reference,bride_funded_amount,beaura_funded_amount")
      .eq("status","pending").order("created_at",{ascending:true});
    if(loadError){setError(loadError.message);setItems([]);setLoading(false);return;}
    const rows=(data||[]) as Transfer[]; setItems(rows);
    const bookingIds=rows.map(x=>x.booking_id); const muaIds=[...new Set(rows.map(x=>x.mua_id))];
    if(bookingIds.length){
      const result=await supabase.from("bookings").select("id,booking_date,booking_time,travel_fee,location").in("id",bookingIds);
      if(result.error)setError(result.error.message); else setBookings(Object.fromEntries((result.data||[]).map((x:any)=>[x.id,x])));
    } else setBookings({});
    if(muaIds.length){
      const result=await supabase.from("mua_profiles").select("id,first_name,last_name").in("id",muaIds);
      if(result.error)setError(result.error.message); else setArtists(Object.fromEntries((result.data||[]).map((x:any)=>[x.id,x])));
    } else setArtists({});
    setLoading(false);
  },[]);
  useEffect(()=>{void load();const channel=supabase.channel("admin-pending-deposits").on("postgres_changes",{event:"*",schema:"public",table:"booking_deposit_transfers"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(channel);};},[load]);

  async function markTransferred(item:Transfer){
    if(busy)return;
    const reference=(refs[item.id]||"").trim();
    if(!reference){setError("Enter the transfer reference before marking this deposit as transferred.");return;}
    setBusy(item.id);setError(null);setMessage(null);
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setError("Your admin session has expired. Please sign in again.");setBusy(null);return;}
    const {data:updated,error:updateError}=await supabase.from("booking_deposit_transfers").update({
      status:"transferred",transfer_reference:reference,admin_user_id:user.id,
      transferred_at:new Date().toISOString(),admin_notes:(notes[item.id]||"").trim()||null,
    }).eq("id",item.id).eq("status","pending").select("id").maybeSingle();
    if(updateError)setError(updateError.message);
    else if(!updated)setError("This deposit was already updated. Refresh the page.");
    else {setMessage("Deposit Transferred. The transfer has been recorded.");await load();}
    setBusy(null);
  }
  const money=(v:number|null|undefined)=>`EGP ${Number(v||0).toLocaleString("en-EG",{maximumFractionDigits:2})}`;

  return <main className="mx-auto max-w-6xl space-y-6 text-[#171018]">
    <header className="rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Admin · Finance</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-4xl font-light tracking-[-0.07em] sm:text-5xl">Pending Deposits</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6077]">Bank-transfer deposits approved by admin. Transfer the MUA's deposit share externally, then record it here. Wallet-credit bookings are handled through MUA wallet payouts instead.</p></div>
        <button onClick={()=>void load()} className="rounded-full border border-[#eadff5] px-5 py-3 text-sm">Refresh</button>
      </div>
    </header>
    {error&&<p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">{message}</p>}
    {loading?<div className="rounded-2xl border border-[#eadff5] bg-white p-8 text-sm text-[#6f6077]">Loading pending deposits…</div>
    :items.length===0?<div className="rounded-[2rem] border border-dashed border-[#eadff5] bg-white p-10 text-center"><h2 className="text-xl font-medium">No pending deposits</h2><p className="mt-2 text-sm text-[#6f6077]">Approved bank-transfer deposits will appear here.</p></div>
    :<div className="space-y-4">{items.map(item=>{const booking=bookings[item.booking_id];const artist=artists[item.mua_id];const name=`${artist?.first_name||""} ${artist?.last_name||""}`.trim()||"Makeup artist";return <article key={item.id} className="rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-[#9876a9]">Order #{item.booking_id.slice(0,8)}</p><h2 className="mt-2 text-2xl font-medium">{name}</h2><p className="mt-1 text-sm text-[#6f6077]">{booking?`${booking.booking_date} · ${booking.booking_time}`:"Booking details unavailable"}</p>{booking?.location&&<p className="mt-1 text-sm text-[#6f6077]">{booking.location}</p>}</div><div className="sm:text-right"><p className="text-xs uppercase tracking-[0.14em] text-[#9876a9]">MUA deposit share</p><p className="mt-1 text-3xl font-semibold">{money(item.amount)}</p></div></div>
      <div className="mt-5 grid gap-3 rounded-2xl bg-[#fffafc] p-4 text-sm sm:grid-cols-3"><p><span className="text-[#8a7d91]">Bride-funded:</span> <strong>{money(item.bride_funded_amount)}</strong></p><p><span className="text-[#8a7d91]">Beaura-funded:</span> <strong>{money(item.beaura_funded_amount)}</strong></p><p><span className="text-[#8a7d91]">Travel fee:</span> <strong>{money(booking?.travel_fee)}</strong></p></div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <label className="block"><span className="mb-2 block text-xs font-medium text-[#6f6077]">Transfer reference *</span><input value={refs[item.id]||""} onChange={e=>setRefs(old=>({...old,[item.id]:e.target.value}))} placeholder="Transfer reference" className="w-full rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-purple-400"/></label>
        <label className="block"><span className="mb-2 block text-xs font-medium text-[#6f6077]">Admin notes</span><input value={notes[item.id]||""} onChange={e=>setNotes(old=>({...old,[item.id]:e.target.value}))} placeholder="Optional note" className="w-full rounded-xl border border-[#eadff5] px-4 py-3 text-sm outline-none focus:border-purple-400"/></label>
        <button onClick={()=>void markTransferred(item)} disabled={busy===item.id} className="self-end rounded-full bg-[#171018] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{busy===item.id?"Saving…":"Deposit Transferred"}</button>
      </div>
    </article>})}</div>}
  </main>;
}
