#!/usr/bin/env python3
"""
Enhance trade timeline chart with tooltips and tier filtering,
add detailed alert modal, and improve alerts tab empty state
"""

def enhance_features():
    with open('public/static/app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Replace renderGantt with enhanced version (tier filter + tooltips)
    old_gantt = 'function renderGantt(alerts) {'
    gantt_replacement = '''function renderGantt(alerts) {
  const tierFilter = STATE.selectedTierFilter || 'all';
  // Filter alerts by selected tier
  const filteredAlerts = tierFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.tiers && a.tiers.includes(tierFilter));
    
  if (!filteredAlerts.length) {
    return `<p style="font-size:13px;color:rgba(90,45,25,0.65);text-align:center;padding:40px 0;">
      No ${tierFilter !== 'all' ? TIERS[tierFilter]?.label + ' tier ' : ''}trades to display
    </p>`;
  }

  const barColor = (a) => a.status === 'active' ? '#1A6FAD' : a.status === 'closed' ? '#1A7A50' : '#C0302A';

  // Only show months from earliest alert to today
  const allMonths = filteredAlerts.map(a => getMonthIdx(a.buyDate) ?? 0);
  const minMonth = Math.min(...allMonths, TODAY_MONTH);
  const maxMonth = TODAY_MONTH;
  const visibleMonths = MONTHS.slice(minMonth, maxMonth + 1);
  const totalCols = Math.max(visibleMonths.length, 1);

  return `
<div style="overflow-x:auto;">
  <div style="min-width:600px;">
    <!-- Month header row -->
    <div style="display:grid;grid-template-columns:120px repeat(${totalCols},1fr);margin-bottom:10px;gap:3px;align-items:end;">
      <div style="font-size:10px;color:rgba(90,45,25,0.45);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding-bottom:6px;">Ticker · Entry</div>
      ${visibleMonths.map((m, i) => {
        const mIdx = i + minMonth;
        const isCur = mIdx === TODAY_MONTH;
        return `<div style="font-size:11px;color:${isCur?'#E8663A':'#9B8570'};text-align:center;font-weight:${isCur?800:600};letter-spacing:0.04em;padding-bottom:6px;border-bottom:2px solid ${isCur?'#E8663A':'rgba(220,160,130,0.22)'};">${m}${isCur?' ▼':''}</div>`;
      }).join('')}
    </div>
    <!-- Alert rows with hover tooltips -->
    ${filteredAlerts.map(a => {
      const buyM   = getMonthIdx(a.buyDate) ?? 0;
      const rawEnd = a.status === 'active' ? TODAY_MONTH : (a.closeDate ? getMonthIdx(a.closeDate) : TODAY_MONTH);
      const endM   = Math.min(rawEnd, TODAY_MONTH);
      const clampedBuy = Math.max(buyM, minMonth);
      const leftCols   = clampedBuy - minMonth;
      const spanCols   = Math.max(endM - clampedBuy + 1, 1);
      const days = daysToClose(a.buyDate, a.closeDate);
      const pnlStr = a.pnl && a.pnl !== '0%' ? a.pnl : '';
      const tierLabels = (a.tiers || [a.tier]).map(tid => TIERS[tid]?.label || tid).join(', ');
      
      // Tooltip content
      const tooltipText = `${a.ticker} · ${a.title} | ${tierLabels} | Entry: $${a.entry} | Target: $${a.t1} | Stop: $${a.sl} | ${days}d | ${pnlStr || 'Active'}`;
      
      return `
<div style="display:grid;grid-template-columns:120px repeat(${totalCols},1fr);margin-bottom:10px;gap:3px;align-items:center;">
  <div style="display:flex;flex-direction:column;padding-right:8px;">
    <span style="font-size:13px;font-weight:800;color:#2C1810;letter-spacing:-0.3px;">${a.ticker}</span>
    <span style="font-size:10px;color:#9B8570;font-weight:600;">${a.entry ? '$'+a.entry : '—'}</span>
  </div>
  ${Array.from({length:totalCols}).map((_,ci) => {
    const inBar  = ci >= leftCols && ci < leftCols + spanCols;
    const isFirst= ci === leftCols;
    const isLast = ci === leftCols + spanCols - 1;
    if (!inBar) return `<div style="height:36px;background:rgba(220,160,130,0.08);border-radius:6px;"></div>`;
    
    return `<div title="${tooltipText}" onclick="openAlertDetailModal(${a.id})" style="height:36px;background:${barColor(a)};border-radius:${isFirst?'12px 0 0 12px':'0'} ${isLast?'0 12px 12px 0':'0'};display:flex;align-items:center;padding:0 8px;overflow:hidden;justify-content:${isFirst?'flex-start':isLast?'flex-end':'center'};cursor:pointer;transition:opacity 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.12);" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
      ${isFirst && spanCols > 2 ? `<span style="font-size:10px;color:#fff;font-weight:800;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.25);">${days ? days+'d' : ''}</span>` : ''}
      ${isLast && a.status !== 'active' && pnlStr ? `<span style="font-size:10px;color:#fff;white-space:nowrap;font-weight:800;text-shadow:0 1px 3px rgba(0,0,0,0.25);">${pnlStr}</span>` : ''}
    </div>`;
  }).join('')}
</div>`;
    }).join('')}
    <!-- Legend -->
    <div style="display:flex;gap:20px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(220,160,130,0.25);flex-wrap:wrap;align-items:center;">
      ${[['#1A6FAD','Active'],['#1A7A50','Closed'],['#C0302A','Stop Loss']].map(([c,l]) =>
        `<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#7A6958;font-weight:600;">
          <div style="width:28px;height:12px;background:${c};border-radius:6px;box-shadow:0 2px 6px ${c}55;"></div>${l}
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#E8663A;font-weight:800;margin-left:auto;">
        ▼ Today · ${MONTHS[TODAY_MONTH]} 2026
      </div>
    </div>
  </div>
</div>`;
}'''
    
    # Find and replace entire function
    start = content.find(old_gantt)
    if start > 0:
        # Find end of function
        end = content.find('\n\n// ─── Account Tab', start)
        if end > 0:
            content = content[:start] + gantt_replacement + content[end:]
    
    # 2. Add detailed alert modal function
    alert_modal_func = '''

// ─── Alert Detail Modal ──────────────────────────────────────────────────────
function openAlertDetailModal(alertId) {
  const alert = STATE.alerts.find(a => a.id === alertId);
  if (!alert) return;
  
  const tierLabels = (alert.tiers || [alert.tier]).map(tid => {
    const t = TIERS[tid];
    return t ? `<span style="background:${t.bg};color:${t.color};font-size:10px;font-weight:800;text-transform:uppercase;padding:5px 11px;border-radius:6px;letter-spacing:0.10em;">${t.label}</span>` : '';
  }).join(' ');
  
  const days = daysToClose(alert.buyDate, alert.closeDate);
  const statusColor = alert.status === 'active' ? C.activeText : alert.status === 'closed' ? C.closedText : C.stoppedText;
  const statusBg = alert.status === 'active' ? C.activeBg : alert.status === 'closed' ? C.closedBg : C.stoppedBg;
  const pnlNum = parseFloat(alert.pnl);
  const pnlColor = pnlNum >= 0 ? '#1A7A50' : '#C0302A';
  
  const modal = `
    <div id="alertDetailModal" onclick="if(event.target.id==='alertDetailModal')closeAlertDetailModal()" 
         style="position:fixed;inset:0;background:rgba(44,24,16,0.75);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s;">
      <div onclick="event.stopPropagation()" style="${cardStyle}max-width:680px;width:100%;max-height:90vh;overflow-y:auto;position:relative;animation:slideUp 0.3s;">
        <button onclick="closeAlertDetailModal()" style="position:absolute;top:20px;right:20px;background:rgba(200,195,188,0.30);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;font-size:18px;color:#5A2D19;" onmouseover="this.style.background='rgba(200,195,188,0.50)'" onmouseout="this.style.background='rgba(200,195,188,0.30)'">×</button>
        
        <!-- Header -->
        <div style="margin-bottom:20px;">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">
            <h2 style="font-size:26px;font-weight:900;color:#2C1810;margin:0;letter-spacing:-0.6px;">${alert.ticker}</h2>
            ${tierLabels}
          </div>
          <h3 style="font-size:18px;font-weight:600;color:#5A2D19;margin:0 0 10px 0;">${alert.title}</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:800;text-transform:uppercase;padding:5px 12px;border-radius:6px;letter-spacing:0.08em;">${alert.status}</span>
            <span style="background:${C.chipBg};color:${C.chipText};font-size:11px;font-weight:800;text-transform:uppercase;padding:5px 12px;border-radius:6px;letter-spacing:0.08em;">${alert.category}</span>
            <span style="background:rgba(200,195,188,0.35);color:#5A2D19;font-size:11px;font-weight:700;padding:5px 12px;border-radius:6px;">${alert.priority} priority</span>
          </div>
        </div>
        
        <!-- Description -->
        ${alert.description ? `
        <div style="background:rgba(248,245,242,0.60);border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="font-size:14px;color:#2C1810;line-height:1.6;margin:0;">${alert.description}</p>
        </div>` : ''}
        
        <!-- Trade Details Grid -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px;">
          <div style="background:linear-gradient(135deg,#1A7A50 0%,#15995C 100%);border-radius:14px;padding:18px;color:#fff;box-shadow:0 4px 16px rgba(26,122,80,0.25);">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;opacity:0.75;letter-spacing:0.10em;margin-bottom:6px;">Entry Price</div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.6px;">$${alert.entry}</div>
          </div>
          <div style="background:linear-gradient(135deg,#1A6FAD 0%,#2A8FCD 100%);border-radius:14px;padding:18px;color:#fff;box-shadow:0 4px 16px rgba(26,111,173,0.25);">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;opacity:0.75;letter-spacing:0.10em;margin-bottom:6px;">Target (T1)</div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.6px;">$${alert.t1}</div>
          </div>
          <div style="background:linear-gradient(135deg,#C0302A 0%,#E04030 100%);border-radius:14px;padding:18px;color:#fff;box-shadow:0 4px 16px rgba(192,48,42,0.25);">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;opacity:0.75;letter-spacing:0.10em;margin-bottom:6px;">Stop Loss</div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.6px;">$${alert.sl}</div>
          </div>
          <div style="background:${pnlNum >= 0 ? 'linear-gradient(135deg,#1A7A50 0%,#15995C 100%)' : 'linear-gradient(135deg,#C0302A 0%,#E04030 100%)'};border-radius:14px;padding:18px;color:#fff;box-shadow:0 4px 16px ${pnlColor}40;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;opacity:0.75;letter-spacing:0.10em;margin-bottom:6px;">P&L</div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.6px;">${alert.pnl}</div>
          </div>
        </div>
        
        <!-- Timeline Info -->
        <div style="background:rgba(248,245,242,0.60);border-radius:12px;padding:16px;">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">
            <div>
              <div style="font-size:11px;font-weight:700;color:rgba(90,45,25,0.60);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Buy Date</div>
              <div style="font-size:14px;font-weight:700;color:#2C1810;">${fmtDate(alert.buyDate)}</div>
            </div>
            ${alert.closeDate ? `
            <div>
              <div style="font-size:11px;font-weight:700;color:rgba(90,45,25,0.60);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Close Date</div>
              <div style="font-size:14px;font-weight:700;color:#2C1810;">${fmtDate(alert.closeDate)}</div>
            </div>` : ''}
            ${days ? `
            <div>
              <div style="font-size:11px;font-weight:700;color:rgba(90,45,25,0.60);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Duration</div>
              <div style="font-size:14px;font-weight:700;color:#2C1810;">${days} days</div>
            </div>` : ''}
            <div>
              <div style="font-size:11px;font-weight:700;color:rgba(90,45,25,0.60);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Views</div>
              <div style="font-size:14px;font-weight:700;color:#2C1810;">${alert.views || 0}</div>
            </div>
          </div>
        </div>
        
        ${alert.updatedAt && alert.updatedAt !== alert.created ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(200,195,188,0.35);font-size:11px;color:rgba(90,45,25,0.60);text-align:center;">
          Updated on ${fmtDate(alert.updatedAt)}
        </div>` : ''}
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function closeAlertDetailModal() {
  const modal = document.getElementById('alertDetailModal');
  if (modal) modal.remove();
}

'''
    
    # Insert before "// ─── Account Tab"
    account_tab_marker = '\n// ─── Account Tab ──────────────────────────────────────────────────────────────\n'
    content = content.replace(account_tab_marker, alert_modal_func + account_tab_marker, 1)
    
    # 3. Update alerts tab empty state message
    old_empty_alerts = """        <p style="font-size:13px;color:rgba(90,45,25,0.60);text-align:center;padding:60px 20px;">
          No ${filtered} alerts found. Clear filters or check back soon.
        </p>"""
    
    new_empty_alerts = """        <div style="text-align:center;padding:60px 20px;">
          <div style="font-size:48px;margin-bottom:16px;opacity:0.3;">📊</div>
          <p style="font-size:16px;font-weight:700;color:#5A2D19;margin:0 0 8px 0;">
            ${alertFilter === 'active' ? 'No Open Alerts Right Now' : 'No Alerts Found'}
          </p>
          <p style="font-size:13px;color:rgba(90,45,25,0.60);margin:0;max-width:420px;margin-left:auto;margin-right:auto;line-height:1.5;">
            ${alertFilter === 'active' 
              ? "We're analyzing market conditions to identify high-conviction entry points. Check back soon for new trade signals." 
              : "Try clearing filters or adjusting your search criteria."}
          </p>
        </div>"""
    
    content = content.replace(old_empty_alerts, new_empty_alerts, 1)
    
    # 4. Make alert cards clickable to open detail modal
    # Find renderAlertCard and add onclick to the card
    old_card_div = """  return `
<div style="position:relative;${glass}border-radius:16px;padding:18px 20px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;box-shadow:0 3px 16px rgba(80,70,60,0.12);" 
     onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(80,70,60,0.20)';" 
     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 3px 16px rgba(80,70,60,0.12)';">"""
    
    new_card_div = """  return `
<div onclick="openAlertDetailModal(${a.id})" style="position:relative;${glass}border-radius:16px;padding:18px 20px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;box-shadow:0 3px 16px rgba(80,70,60,0.12);" 
     onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(80,70,60,0.20)';" 
     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 3px 16px rgba(80,70,60,0.12)';">"""
    
    content = content.replace(old_card_div, new_card_div, 1)
    
    # Write updated content
    with open('public/static/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Enhanced features successfully")

if __name__ == '__main__':
    enhance_features()
