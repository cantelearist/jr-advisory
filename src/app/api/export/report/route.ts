/* ── Client Report Export — branded HTML report ── */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

function reportHTML(type: string, cli: Record<string, unknown>, eng: Record<string, unknown>,
  invs: Record<string, unknown>[], tl: Record<string, unknown>[], docs: Record<string, unknown>[]) {
  const tb = invs.reduce((s, i) => s + Number(i.amount || 0), 0);
  const tp = invs.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const outs = tb - tp;
  const phases: Record<string, string> = { '1': 'Confidential Consultation', '2': 'Independent Assessment', '3': 'Scope & Vendor Curation', '4': 'Oversight & Clearance' };
  const fmtD = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fmtS = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const title = type === 'financial' ? 'Financial Report' : type === 'engagement' ? 'Engagement Report' : 'Client Summary';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cormorant Garamond',Georgia,serif;background:#0a0a0a;color:#e8e0d4;width:816px;padding:60px}
.hdr{display:flex;justify-content:space-between;margin-bottom:48px;border-bottom:1px solid rgba(201,169,110,0.2);padding-bottom:24px}
.logo{font-size:28px;font-weight:600;letter-spacing:2px;color:#c9a96e}
.logo-sub{font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.4);margin-top:4px}
h2{font-size:14px;letter-spacing:3px;color:#c9a96e;margin:32px 0 16px;text-transform:uppercase}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.sc{padding:20px;border:1px solid rgba(255,255,255,0.08)}
.sl{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase}
.sv{font-size:24px;margin-top:4px}
.green{color:#6ec9a0}.gold{color:#c9a96e}
table{width:100%;border-collapse:collapse;margin-bottom:32px}
th{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-align:left;padding:12px 8px;border-bottom:1px solid rgba(255,255,255,0.1);text-transform:uppercase}
td{padding:12px 8px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px}
.ti{padding:12px 0;border-left:2px solid rgba(201,169,110,0.2);padding-left:16px;margin-bottom:8px}
.td{font-size:12px;color:rgba(255,255,255,0.3)}
.ft{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.05)}
.ft p{font-size:12px;color:rgba(255,255,255,0.3);line-height:1.8}
</style></head><body>
<div class="hdr"><div><div class="logo">JAMES ROMAN</div><div class="logo-sub">ADVISORY</div></div>
<div style="text-align:right"><div style="font-size:28px;letter-spacing:3px;color:rgba(255,255,255,0.3);text-transform:uppercase">${title}</div>
<div style="font-size:12px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-top:4px">${fmtD(new Date().toISOString())}</div></div></div>

<h2>Client Information</h2>
<div class="sg">
<div class="sc"><div class="sl">Client</div><div class="sv">${cli.name||'N/A'}</div></div>
<div class="sc"><div class="sl">Property</div><div class="sv" style="font-size:16px">${cli.property||'N/A'}</div></div>
<div class="sc"><div class="sl">Status</div><div class="sv gold">${String(cli.status||'').toUpperCase()}</div></div></div>

${eng ? `<h2>Engagement</h2><div class="sg">
<div class="sc"><div class="sl">Type</div><div class="sv" style="font-size:16px">${eng.type||''}</div></div>
<div class="sc"><div class="sl">Phase</div><div class="sv">${phases[String(eng.phase||'1')]||''}</div></div>
<div class="sc"><div class="sl">Start</div><div class="sv" style="font-size:16px">${fmtD(String(eng.start_date||''))}</div></div></div>` : ''}

<h2>Financial Summary</h2>
<div class="sg">
<div class="sc"><div class="sl">Total Billed</div><div class="sv">$${tb.toLocaleString()}</div></div>
<div class="sc"><div class="sl">Collected</div><div class="sv green">$${tp.toLocaleString()}</div></div>
<div class="sc"><div class="sl">Outstanding</div><div class="sv gold">$${outs.toLocaleString()}</div></div></div>

<h2>Invoices</h2>
<table><thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
<tbody>${invs.map(i=>`<tr><td>${i.invoice_number||''}</td><td>${i.description||''}</td><td>$${Number(i.amount||0).toLocaleString()}</td>
<td style="color:${i.status==='paid'?'#6ec9a0':i.status==='overdue'?'#c96e6e':'#c9a96e'}">${String(i.status||'').toUpperCase()}</td>
<td>${fmtS(String(i.due_date||''))}</td></tr>`).join('')}</tbody></table>

${tl.length > 0 ? `<h2>Timeline</h2>${tl.map(t=>`<div class="ti"><div class="td">${fmtS(String(t.event_date||''))}</div><div>${t.title||''}</div></div>`).join('')}` : ''}

<h2>Documents (${docs.length})</h2>
<table><thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
<tbody>${docs.map(d=>`<tr><td>${d.name||''}</td><td>${d.category||''}</td><td>${d.status||''}</td><td>${fmtS(String(d.created_at||''))}</td></tr>`).join('')}</tbody></table>

<div class="ft"><p class="gold">James Roman Advisory</p>
<p>This report is confidential. Generated ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p></div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const clientId = req.nextUrl.searchParams.get('client_id');
  const type = req.nextUrl.searchParams.get('type') || 'summary';
  if (!clientId) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 });

  const [{ data: cli }, { data: eng }, { data: invs }, { data: docs }] = await Promise.all([
    sb.from('clients').select('*').eq('id', clientId).single(),
    sb.from('engagements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
    sb.from('invoices').select('*').eq('client_id', clientId).order('due_date', { ascending: true }),
    sb.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
  ]);

  let tl: Record<string, unknown>[] = [];
  if (eng) {
    const { data } = await sb.from('timeline_events').select('*').eq('engagement_id', eng.id).order('event_date', { ascending: true });
    tl = (data || []) as Record<string, unknown>[];
  }

  await sb.from('audit_log').insert({ action: 'report_exported', entity_type: 'report', entity_id: clientId, metadata: { type, client_name: cli?.name } });

  const html = reportHTML(type, cli || {}, eng || {}, (invs || []) as Record<string, unknown>[], tl, (docs || []) as Record<string, unknown>[]);
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `inline; filename="${(cli?.name||'report').replace(/\s+/g,'_')}_${type}.html"` },
  });
}
