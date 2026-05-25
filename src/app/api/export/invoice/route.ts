/* ── Invoice Export — branded HTML invoice for print/PDF/image ── */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function invoiceHTML(inv: Record<string, unknown>, cli: Record<string, unknown>, eng: Record<string, unknown>) {
  const amt = Number(inv.amount || 0);
  const status = String(inv.status || 'draft').toUpperCase();
  const sc = status === 'PAID' ? '#6ec9a0' : status === 'OVERDUE' ? '#c96e6e' : '#c9a96e';
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cormorant Garamond',Georgia,serif;background:#0a0a0a;color:#e8e0d4;width:816px;padding:60px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;border-bottom:1px solid rgba(201,169,110,0.2);padding-bottom:24px}
.logo{font-size:28px;font-weight:600;letter-spacing:2px;color:#c9a96e}
.logo-sub{font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.4);margin-top:4px}
.inv-title{font-size:36px;letter-spacing:3px;color:rgba(255,255,255,0.3);text-align:right}
.inv-num{font-size:14px;letter-spacing:2px;color:#c9a96e;text-align:right;margin-top:4px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:48px}
.meta h3{font-size:11px;letter-spacing:3px;color:rgba(255,255,255,0.3);margin-bottom:8px;text-transform:uppercase}
.meta p{font-size:16px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:48px}
th{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-align:left;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);text-transform:uppercase}
td{padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:16px}
.total td{border-top:2px solid rgba(201,169,110,0.3);font-size:22px;font-weight:600;padding-top:16px}
.badge{display:inline-block;padding:4px 16px;border:1px solid ${sc};color:${sc};font-size:11px;letter-spacing:2px;border-radius:2px}
.ft{margin-top:64px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.05)}
.ft p{font-size:12px;color:rgba(255,255,255,0.3);line-height:1.8}
.gold{color:#c9a96e}
</style></head><body>
<div class="hdr"><div><div class="logo">JAMES ROMAN</div><div class="logo-sub">ADVISORY</div></div>
<div><div class="inv-title">INVOICE</div><div class="inv-num">${inv.invoice_number||''}</div></div></div>
<div class="meta"><div><h3>Billed To</h3><p>${cli.name||''}<br>${cli.property||''}<br>${cli.area||''}</p></div>
<div><h3>Invoice Details</h3><p>Date: ${fmtDate(String(inv.created_at||''))}<br>Due: ${fmtDate(String(inv.due_date||''))}<br>Status: <span class="badge">${status}</span></p></div></div>
<table><thead><tr><th>Description</th><th>Engagement</th><th style="text-align:right">Amount</th></tr></thead>
<tbody><tr><td>${inv.description||''}</td><td>${eng.type||''}</td><td style="text-align:right">$${amt.toLocaleString()}</td></tr>
<tr class="total"><td colspan="2">Total Due</td><td style="text-align:right;color:#c9a96e">$${amt.toLocaleString()}</td></tr></tbody></table>
${inv.notes?`<div style="margin-bottom:32px;padding:16px;background:rgba(255,255,255,0.02);border-left:2px solid rgba(201,169,110,0.3)"><p style="font-size:14px;font-style:italic;color:rgba(255,255,255,0.5)">${inv.notes}</p></div>`:''}
${inv.paid_date?`<p style="color:#6ec9a0;font-size:14px;margin-bottom:32px">✓ Payment received ${fmtDate(String(inv.paid_date))}</p>`:''}
<div class="ft"><p class="gold">James Roman Advisory</p>
<p>Independent Hazmat Remediation Oversight<br>Los Angeles Westside · Malibu · Beverly Hills · Brentwood<br>(310) 430-2500 · roman@jamesroman.la</p>
<p style="margin-top:16px">This invoice is confidential. Payment terms: Net 30 days.</p></div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: inv } = await sb.from('invoices').select('*').eq('id', id).single();
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: cli } = await sb.from('clients').select('*').eq('id', inv.client_id).single();
  const { data: eng } = await sb.from('engagements').select('*').eq('id', inv.engagement_id).single();

  await sb.from('audit_log').insert({ action: 'invoice_exported', entity_type: 'invoice', entity_id: id, metadata: { invoice_number: inv.invoice_number } });

  return new NextResponse(invoiceHTML(inv, cli || {}, eng || {}), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `inline; filename="${inv.invoice_number}.html"` },
  });
}
