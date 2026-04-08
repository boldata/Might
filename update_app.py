#!/usr/bin/env python3
"""
Update app.js with multi-tier support, enhanced charts, and new features
"""

def update_app_js():
    with open('public/static/app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update renderSubscriberDashboard to add tier filter dropdown and calculate per-tier KPIs
    old_dashboard_start = """function renderSubscriberDashboard() {
  const u        = STATE.currentUser;
  const tier     = u.tier ? TIERS[u.tier] : null;
  const locked   = isLocked(u);
  const visible  = getVisibleAlerts();"""
    
    new_dashboard_start = """function renderSubscriberDashboard() {
  const u        = STATE.currentUser;
  const tier     = u.tier ? TIERS[u.tier] : null;
  const locked   = isLocked(u);
  const tierFilter = STATE.selectedTierFilter || 'all';
  const visible  = getVisibleAlerts(tierFilter === 'all' ? null : tierFilter);"""
    
    content = content.replace(old_dashboard_start, new_dashboard_start, 1)
    
    # 2. Add tier filter selector before stats row
    old_greeting = """  const dateStr  = TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const greeting = getGreeting(u.name);

  return `
<div style="${glass}border-radius:20px;padding:30px;margin-bottom:24px;">"""
    
    new_greeting = """  const dateStr  = TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const greeting = getGreeting(u.name);
  
  // Tier filter dropdown
  const visibleTiers = Object.values(TIERS).filter(t => t.visible).sort((a, b) => a.order - b.order);
  const tierFilterHtml = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="font-size:13px;font-weight:600;color:#5A2D19;">Filter by Tier:</span>
      <select id="tierFilterSelect" onchange="STATE.selectedTierFilter=this.value;render();" 
              style="padding:8px 16px;border-radius:8px;border:1.5px solid rgba(200,195,188,0.60);background:#fff;font-size:13px;font-weight:600;cursor:pointer;">
        <option value="all" ${tierFilter === 'all' ? 'selected' : ''}>All Tiers</option>
        ${visibleTiers.map(t => `<option value="${t.id}" ${tierFilter === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
      </select>
    </div>`;

  return `
<div style="${glass}border-radius:20px;padding:30px;margin-bottom:24px;">"""
    
    content = content.replace(old_greeting, new_greeting, 1)
    
    # 3. Insert tier filter before stats row
    old_stats_row = """  <!-- Stats Row (4 KPI cards) -->
  <div style="display:flex;gap:18px;margin-bottom:26px;flex-wrap:wrap;">"""
    
    new_stats_row = """  ${tierFilterHtml}
  
  <!-- Stats Row (5 KPI cards with tier-specific data) -->
  <div style="display:flex;gap:18px;margin-bottom:26px;flex-wrap:wrap;">"""
    
    content = content.replace(old_stats_row, new_stats_row, 1)
    
    # 4. Update empty alerts message
    old_empty = """          <p style="font-size:13px;color:rgba(90,45,25,0.60);margin:8px 0 0 0;">You have no open positions at the moment. New alerts will appear here.</p>"""
    
    new_empty = """          <p style="font-size:13px;color:rgba(90,45,25,0.60);margin:8px 0 0 0;">We're currently analyzing markets to find the perfect entry points. Check back soon for new high-conviction trade signals.</p>"""
    
    content = content.replace(old_empty, new_empty, 1)
    
    # 5. Update alert card to show multiple tier badges
    # Find renderAlertCard function and update tier display
    old_tier_chip = """  const tierInfo = TIERS[a.tier] || { label: a.tier, color: '#9B8570' };"""
    
    new_tier_chip = """  // Support multi-tier alerts: show all tiers as chips
  const alertTiers = Array.isArray(a.tiers) ? a.tiers : [a.tier];
  const tierChips = alertTiers.map(tierId => {
    const tierInfo = TIERS[tierId] || { label: tierId, color: '#9B8570' };
    return `<span style="background:rgba(255,200,170,0.65);color:#8B3C10;font-size:9px;font-weight:800;text-transform:uppercase;padding:4px 9px;border-radius:6px;letter-spacing:0.10em;">${tierInfo.label}</span>`;
  }).join(' ');"""
    
    content = content.replace(old_tier_chip, new_tier_chip, 1)
    
    # Replace the single tier chip with multi-tier chips in the header
    old_header_tier = """    <span style="background:${chipBg};color:${chipText};font-size:9px;font-weight:800;text-transform:uppercase;padding:4px 9px;border-radius:6px;letter-spacing:0.10em;">${tierInfo.label}</span>"""
    
    new_header_tier = """    ${tierChips}"""
    
    content = content.replace(old_header_tier, new_header_tier, 1)
    
    # 6. Update admin alert form to support multi-tier selection
    old_tier_select = """      <label style="${labelStyle}">Tier</label>
      <select id="alertTier" style="${inputStyle}">
        <option value="trader" ${alert?.tier === 'trader' ? 'selected' : ''}>Trader</option>
        <option value="elite" ${alert?.tier === 'elite' ? 'selected' : ''}>Elite</option>
      </select>"""
    
    new_tier_select = """      <label style="${labelStyle}">Target Tiers (select multiple)</label>
      <div style="display:flex;flex-direction:column;gap:8px;padding:12px;border:1.5px solid rgba(200,195,188,0.60);border-radius:10px;background:#fff;">
        ${Object.values(TIERS).filter(t => t.visible).sort((a, b) => a.order - b.order).map(t => {
          const checked = alert?.tiers?.includes(t.id) || (alert?.tier === t.id && !alert?.tiers);
          return `
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
              <input type="checkbox" name="alertTiers" value="${t.id}" ${checked ? 'checked' : ''}
                     style="width:18px;height:18px;cursor:pointer;">
              <span style="font-size:13px;font-weight:600;color:${t.color};">${t.label} ($${t.price}/mo)</span>
            </label>`;
        }).join('')}
      </div>"""
    
    content = content.replace(old_tier_select, new_tier_select, 1)
    
    # 7. Update saveAlertForm to collect multiple tiers
    old_save_tier = """  const tier        = doc.getElementById('alertTier')?.value || 'trader';"""
    
    new_save_tier = """  const tierCheckboxes = Array.from(doc.querySelectorAll('input[name="alertTiers"]:checked'));
  const tiers = tierCheckboxes.length > 0 ? tierCheckboxes.map(cb => cb.value) : ['trader'];"""
    
    content = content.replace(old_save_tier, new_save_tier, 1)
    
    # Update the API call to send tiers array
    old_api_tier = """      ticker, title, description, category, tier, priority, status,"""
    new_api_tier = """      ticker, title, description, category, tiers, priority, status,"""
    content = content.replace(old_api_tier, new_api_tier, 1)
    
    # 8. Add phone field to user form for Prime/Exclusive tiers
    old_tier_selector = """      <div style="display:flex;gap:12px;margin-bottom:18px;">
        <div style="flex:1;cursor:pointer;" onclick="selectUserTier('trader')">"""
    
    new_tier_selector = """      <label style="${labelStyle}">Phone (required for Prime & Exclusive)</label>
      <input type="tel" id="userPhone" placeholder="+1 (555) 123-4567" value="${user?.phone || ''}" style="${inputStyle}">
      
      <div style="display:flex;gap:12px;margin-bottom:18px;">
        <div style="flex:1;cursor:pointer;" onclick="selectUserTier('trader')">"""
    
    content = content.replace(old_tier_selector, new_tier_selector, 1)
    
    # Update saveUserForm to include phone
    old_user_save = """  const name     = doc.getElementById('userName')?.value?.trim();
  const email    = doc.getElementById('userEmail')?.value?.trim();
  const password = doc.getElementById('userPassword')?.value;"""
    
    new_user_save = """  const name     = doc.getElementById('userName')?.value?.trim();
  const email    = doc.getElementById('userEmail')?.value?.trim();
  const password = doc.getElementById('userPassword')?.value;
  const phone    = doc.getElementById('userPhone')?.value?.trim();"""
    
    content = content.replace(old_user_save, new_user_save, 1)
    
    # Add phone validation
    old_validation = """  if (!name || !email) {
    showError('Name and email are required.');
    return;
  }"""
    
    new_validation = """  if (!name || !email) {
    showError('Name and email are required.');
    return;
  }
  if ((tier === 'prime' || tier === 'exclusive') && !phone) {
    showError(`Phone number is required for ${tier === 'prime' ? 'Prime' : 'Exclusive'} tier.`);
    return;
  }"""
    
    content = content.replace(old_validation, new_validation, 1)
    
    # Include phone in API payload
    old_payload = """      name, email, password, tier, subscriptionStatus: status"""
    new_payload = """      name, email, password, phone, tier, subscriptionStatus: status"""
    content = content.replace(old_payload, new_payload, 1)
    
    # 9. Add Tier Management sub-tab in Analytics
    old_analytics_tabs = """    <div style="display:flex;gap:10px;margin-bottom:22px;border-bottom:2px solid rgba(200,195,188,0.35);padding-bottom:6px;">
      <button onclick="STATE.adminAnalyticsTab='overview';render();" style="${STATE.adminAnalyticsTab === 'overview' ? btnStyle('primary') : btnStyle('secondary')}">Overview</button>
      <button onclick="STATE.adminAnalyticsTab='pricing';render();" style="${STATE.adminAnalyticsTab === 'pricing' ? btnStyle('primary') : btnStyle('secondary')}">Pricing Management</button>
    </div>"""
    
    new_analytics_tabs = """    <div style="display:flex;gap:10px;margin-bottom:22px;border-bottom:2px solid rgba(200,195,188,0.35);padding-bottom:6px;">
      <button onclick="STATE.adminAnalyticsTab='overview';render();" style="${STATE.adminAnalyticsTab === 'overview' ? btnStyle('primary') : btnStyle('secondary')}">Overview</button>
      <button onclick="STATE.adminAnalyticsTab='pricing';render();" style="${STATE.adminAnalyticsTab === 'pricing' ? btnStyle('primary') : btnStyle('secondary')}">Pricing Management</button>
      <button onclick="STATE.adminAnalyticsTab='tiers';render();" style="${STATE.adminAnalyticsTab === 'tiers' ? btnStyle('primary') : btnStyle('secondary')}">Tier Management</button>
      ${STATE.notifications.filter(n => !n.read).length > 0 ? `<span style="background:#E8663A;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:12px;margin-left:auto;">${STATE.notifications.filter(n => !n.read).length}</span>` : ''}
    </div>"""
    
    content = content.replace(old_analytics_tabs, new_analytics_tabs, 1)
    
    # Add tier management UI after pricing management
    old_analytics_content = """    ${STATE.adminAnalyticsTab === 'overview' ? renderAnalyticsOverview() : renderPricingManagement()}"""
    
    new_analytics_content = """    ${STATE.adminAnalyticsTab === 'overview' ? renderAnalyticsOverview() : STATE.adminAnalyticsTab === 'pricing' ? renderPricingManagement() : renderTierManagement()}"""
    
    content = content.replace(old_analytics_content, new_analytics_content, 1)
    
    # 10. Add renderTierManagement function before renderPricingManagement
    tier_mgmt_func = """
function renderTierManagement() {
  const tiers = Object.values(TIERS).sort((a, b) => a.order - b.order);
  const unreadNotifications = STATE.notifications.filter(n => !n.read);
  
  return `
    <div style="${cardStyle}padding:24px;">
      <h3 style="font-size:18px;font-weight:700;color:#2C1810;margin:0 0 16px 0;">Tier Management</h3>
      <p style="font-size:13px;color:rgba(90,45,25,0.70);margin:0 0 20px 0;">
        Control which tiers are visible to subscribers. Hidden tiers won't appear in signup/upgrade options.
      </p>
      
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1.5px solid rgba(200,195,188,0.50);">Tier</th>
            <th style="text-align:right;padding:10px;border-bottom:1.5px solid rgba(200,195,188,0.50);">Price/mo</th>
            <th style="text-align:center;padding:10px;border-bottom:1.5px solid rgba(200,195,188,0.50);">Visible to Subscribers</th>
            <th style="text-align:right;padding:10px;border-bottom:1.5px solid rgba(200,195,188,0.50);">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tiers.map(t => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid rgba(200,195,188,0.25);">
                <span style="font-weight:600;color:${t.color};">${t.label}</span>
              </td>
              <td style="padding:10px;border-bottom:1px solid rgba(200,195,188,0.25);text-align:right;">
                $${t.price.toLocaleString()}
              </td>
              <td style="padding:10px;border-bottom:1px solid rgba(200,195,188,0.25);text-align:center;">
                <span style="${badgeStyle(t.visible ? 'green' : 'gray')}">${t.visible ? 'Visible' : 'Hidden'}</span>
              </td>
              <td style="padding:10px;border-bottom:1px solid rgba(200,195,188,0.25);text-align:right;">
                <button onclick="toggleTierVisibility('${t.id}', ${!t.visible})" style="${btnStyle('secondary')}font-size:12px;padding:6px 14px;">
                  ${t.visible ? 'Hide' : 'Show'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${unreadNotifications.length > 0 ? `
    <div style="${cardStyle}padding:24px;margin-top:20px;">
      <h3 style="font-size:18px;font-weight:700;color:#2C1810;margin:0 0 16px 0;">
        New Notifications 
        <span style="background:#E8663A;color:#fff;font-size:13px;font-weight:800;padding:3px 10px;border-radius:12px;margin-left:10px;">
          ${unreadNotifications.length}
        </span>
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${unreadNotifications.map(n => `
          <div style="${glass}border-radius:12px;padding:16px;border-left:3px solid ${n.type.includes('prime') ? '#8B6914' : '#1A1A2E'};">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:${n.type.includes('prime') ? '#8B6914' : '#1A1A2E'};letter-spacing:0.10em;">
                ${n.type.replace('signup_', '').toUpperCase()} SIGNUP
              </span>
              <button onclick="markNotificationRead(${n.id})" style="border:none;background:none;color:#9A9189;cursor:pointer;font-size:12px;">
                Mark Read
              </button>
            </div>
            <p style="font-size:13px;color:#2C1810;margin:0;">${n.message}</p>
            <span style="font-size:11px;color:rgba(90,45,25,0.60);margin-top:6px;display:block;">
              ${new Date(n.created_at).toLocaleString()}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

async function toggleTierVisibility(tierId, visible) {
  try {
    await API.put(\`/api/tiers/\${tierId}\`, { visible });
    await loadData();
    render();
  } catch (e) {
    alert('Failed to update tier visibility: ' + e.message);
  }
}

async function markNotificationRead(notificationId) {
  try {
    await API.put(\`/api/notifications/\${notificationId}\`, {});
    await loadData();
    render();
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
  }
}

"""
    
    # Find where to insert (before renderPricingManagement)
    pricing_func_start = content.find('function renderPricingManagement()')
    if pricing_func_start > 0:
        content = content[:pricing_func_start] + tier_mgmt_func + content[pricing_func_start:]
    
    # Write updated content
    with open('public/static/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Updated app.js successfully")

if __name__ == '__main__':
    update_app_js()
