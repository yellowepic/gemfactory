const miners = [
  { name: 'nerdqaxe++', ip: '192.168.0.154', id: 'nerdqaxe', chips: 4, useStats: false },
  { name: 'ak-bitaxe', ip: '192.168.0.157', id: 'ak-bitaxe', chips: 1, useStats: false },
  { name: 'ck-bitaxe', ip: '192.168.0.156', id: 'ck-bitaxe', chips: 1, useStats: false },
];

async function fetchMinerData(miner) {
  try {
    // Revert to Proxy as Direct Connection failed for some miners
    // The proxy now handles User-Agent headers to avoid blocks
    // Generic fetch wrapper to handle text/json debugging
    const safeFetch = async (url) => {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!r.ok) return {};
        let text = await r.text();

        // Aggressive Sanitize: Keep only printable ASCII (x20-x7E) and whitespace (x09, x0A, x0D)
        // This removes \0 (null), \x1F (unit separator), and other binary junk
        text = text.replace(/[^\x20-\x7E\t\n\r]/g, "");

        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn(`JSON Parse Error for ${url}:`, text.substring(0, 50));
          console.warn(`Raw text len: ${text.length}`);
          throw new Error(`Invalid JSON: ${text.substring(0, 15)}...`);
        }
      } catch (e) {
        console.warn(`Fetch failed for ${url}:`, e);
        throw e;
      }
    };

    // Fetch Info
    const infoPromise = safeFetch(`/proxy/${miner.ip}/api/system/info`);

    // Fetch Stats (for extra fields like fan, detail uptime, etc.)
    // Skip valid stats for miners that don't support it to avoid 404s
    let statsPromise = Promise.resolve({});
    if (miner.useStats !== false) {
      statsPromise = safeFetch(`/proxy/${miner.ip}/api/system/stats`);
    }

    const [infoData, statsData] = await Promise.all([infoPromise, statsPromise]);

    // Merge data, prioritizing info but allowing stats to fill gaps
    const data = { ...statsData, ...infoData };

    if (Object.keys(data).length === 0) {
      throw new Error('No data received');
    }

    console.log(`Success ${miner.name}:`, data);
    return { ...data, status: 'online' };
  } catch (error) {
    console.error(`Failed to fetch ${miner.name}:`, error);
    return { status: 'offline', error: error.message || 'Unknown Error' };
  }
}

function createMinerCard(miner) {
  return `
    <div class="miner-card" id="card-${miner.id}">
      <div class="loading-overlay" id="loading-${miner.id}">
          <div class="spinner"></div>
      </div>
      <div class="card-header">
        <div>
          <h2 class="miner-name">${miner.name}</h2>
          <div class="miner-ip">${miner.ip}</div>
        </div>
        <div class="miner-status status-active" id="status-${miner.id}">Connecting</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Hashrate</span>
          <div class="stat-value" id="hash-${miner.id}">-- <span class="unit">GH/s</span></div>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">Power</span>
          <div class="stat-value" id="power-${miner.id}">-- <span class="unit">W</span></div>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">ASIC Temp</span>
          <div class="stat-value" id="asic-temp-${miner.id}">-- <span class="unit">°C</span></div>
        </div>

        <div class="stat-item">
          <span class="stat-label">VR Temp</span>
          <div class="stat-value" id="vr-temp-${miner.id}">-- <span class="unit">°C</span></div>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">Efficiency</span>
          <div class="stat-value" id="eff-${miner.id}">-- <span class="unit">J/TH</span></div>
        </div>
      </div>

      <div class="extended-stats">
        <div class="ext-stat-item">
            <span class="ext-stat-label">Input Voltage</span>
            <span class="ext-stat-value" id="volts-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">ASIC Voltage</span>
            <span class="ext-stat-value" id="asic-volts-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Frequency</span>
            <span class="ext-stat-value" id="freq-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item" style="grid-column: span 2;">
            <span class="ext-stat-label">Best Difficulty</span>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                    <span class="ext-stat-value" id="best-all-time-${miner.id}" style="color: var(--primary);">--</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">all-time best</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                    <span class="ext-stat-value" id="best-session-${miner.id}" style="font-size: 0.9rem;">--</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">since system boot</span>
                </div>
            </div>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Shares</span>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                 <span class="ext-stat-value" id="shares-acc-${miner.id}">--</span>
                 <div style="font-size: 0.75rem; color: var(--error-color);">
                    <span id="shares-rej-${miner.id}">--</span> Rejected 
                    <span id="shares-rej-pct-${miner.id}"></span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  `;
}

function formatUptime(seconds) {
  if (!seconds) return '--';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${m}m`;
}

function formatLargeNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'G';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function updateMinerCard(miner, data) {
  const card = document.getElementById(`card-${miner.id}`);
  const statusEl = document.getElementById(`status-${miner.id}`);
  const loadingEl = document.getElementById(`loading-${miner.id}`);

  // Debug Data to find correct fields
  console.log(`Miner ${miner.id} Data:`, data);

  // Hide loading
  if (loadingEl) loadingEl.style.display = 'none';

  if (data.status === 'offline') {
    card.classList.add('offline');
    statusEl.className = 'miner-status status-offline';
    // Show specific error if available or generic OFFLINE
    statusEl.textContent = data.error ? data.error.substring(0, 15) : 'OFFLINE';
    statusEl.title = data.error || 'Connection Failed'; // Tooltip for full error

    // Clear stats
    document.getElementById(`hash-${miner.id}`).innerHTML = `-- <span class="unit">GH/s</span>`;
    document.getElementById(`power-${miner.id}`).innerHTML = `-- <span class="unit">W</span>`;
    document.getElementById(`asic-temp-${miner.id}`).innerHTML = `-- <span class="unit">°C</span>`;
    document.getElementById(`vr-temp-${miner.id}`).innerHTML = `-- <span class="unit">°C</span>`;
    document.getElementById(`eff-${miner.id}`).innerHTML = `-- <span class="unit">J/TH</span>`;

    document.getElementById(`volts-${miner.id}`).textContent = '--';
    document.getElementById(`asic-volts-${miner.id}`).textContent = '--';
    document.getElementById(`freq-${miner.id}`).textContent = '--';
    document.getElementById(`best-all-time-${miner.id}`).textContent = '--';
    document.getElementById(`best-session-${miner.id}`).textContent = '--';
    document.getElementById(`shares-acc-${miner.id}`).textContent = '--';
    document.getElementById(`shares-rej-${miner.id}`).textContent = '--';
    document.getElementById(`shares-rej-pct-${miner.id}`).textContent = '';
    return;
  }

  card.classList.remove('offline');
  statusEl.className = 'miner-status status-active';
  statusEl.textContent = 'ACTIVE';

  const hashrate = Number(data.hashRate || data.hashrate || 0);
  const power = Number(data.power || 0);

  const asicTemp = Number(data.temp || data.temperature || data.asicTemp || 0);
  // Try plausible fields for VR Temp. 
  // Common: temp2, pcb_temp, vr_temp. 
  // If undefined, default to 0.
  const vrTemp = Number(data.vrTemp || data.temp2 || data.pcb_temp || 0);

  const efficiency = hashrate > 0 ? (power / (hashrate / 1000)).toFixed(2) : 0; // W / (TH/s)

  // Input Voltage (was 'volts' or 'voltage') - typically in mV, sometimes V
  const inputVoltsRaw = data.voltage || data.volts || data.inputVoltage || 0;

  // ASIC (Core) Voltage - typically 1.x V
  const asicVoltsRaw = data.asicVoltage || data.coreVoltage || data.vCore || 0;

  const freq = data.frequency || data.freq || 0;
  const bestShare = data.bestShare || data.best_share || data.bestDiff || 0;
  const rejected = data.sharesRejected || data.rejected || 0;

  // Expected Hashrate Calculation
  const chips = miner.chips || 1;
  const expectedHashrate = freq > 0 ? (freq * 2.04 * chips).toFixed(0) : 0;

  document.getElementById(`hash-${miner.id}`).innerHTML = `
    <div>${Math.round(hashrate)} <span class="unit">GH/s</span></div>
    ${expectedHashrate > 0 ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Exp: ${expectedHashrate} GH/s</div>` : ''}
  `;
  document.getElementById(`power-${miner.id}`).innerHTML = `${Math.round(power)} <span class="unit">W</span>`;

  document.getElementById(`asic-temp-${miner.id}`).innerHTML = `${Math.round(asicTemp)} <span class="unit">°C</span>`;
  document.getElementById(`vr-temp-${miner.id}`).innerHTML = `${Math.round(vrTemp)} <span class="unit">°C</span>`;

  document.getElementById(`eff-${miner.id}`).innerHTML = `${efficiency} <span class="unit">J/TH</span>`;

  // Formatting Input Voltage
  // If > 1000, assumes mV => convert to V. If < 20, assume V.
  let displayInputV = '--';
  if (inputVoltsRaw > 0) {
    const v = inputVoltsRaw > 100 ? inputVoltsRaw / 1000 : inputVoltsRaw;
    displayInputV = `${v.toFixed(3)} V`;
  }
  document.getElementById(`volts-${miner.id}`).textContent = displayInputV;

  // Formatting ASIC Voltage
  // Typically small value (1.x). If > 100, assume mV.
  let displayAsicV = '--';
  if (asicVoltsRaw > 0) {
    const v = asicVoltsRaw > 100 ? asicVoltsRaw / 1000 : asicVoltsRaw;
    displayAsicV = `${v.toFixed(3)} V`;
  }
  document.getElementById(`asic-volts-${miner.id}`).textContent = displayAsicV;

  document.getElementById(`freq-${miner.id}`).textContent = freq ? `${freq} MHz` : '--';

  // Best Difficulty
  // Session: bestShare (or best_share, bestDiff as fallbacks)
  const bestSession = data.bestShare || data.best_share || data.bestDiff || 0;

  // All-time: bestEver (or best_ever, bestType as fallbacks)
  const bestAllTime = data.bestEver || data.best_ever || data.bestType || 0;

  document.getElementById(`best-session-${miner.id}`).textContent = bestSession > 0 ? formatLargeNumber(bestSession) : '--';
  document.getElementById(`best-all-time-${miner.id}`).textContent = bestAllTime > 0 ? formatLargeNumber(bestAllTime) : '--';

  document.getElementById(`best-session-${miner.id}`).textContent = bestSession > 0 ? formatLargeNumber(bestSession) : '--';
  document.getElementById(`best-all-time-${miner.id}`).textContent = bestAllTime > 0 ? formatLargeNumber(bestAllTime) : '--';

  // Shares Logic
  const sharesAccepted = data.sharesAccepted || data.accepted || 0;
  const sharesRejected = data.sharesRejected || data.rejected || 0;
  const sharesTotal = sharesAccepted + sharesRejected;
  const rejPct = sharesTotal > 0 ? ((sharesRejected / sharesTotal) * 100).toFixed(2) : '0.00';

  document.getElementById(`shares-acc-${miner.id}`).textContent = formatLargeNumber(sharesAccepted);
  document.getElementById(`shares-rej-${miner.id}`).textContent = sharesRejected;
  document.getElementById(`shares-rej-pct-${miner.id}`).textContent = `(${rejPct}%)`;
}

async function init() {
  const container = document.getElementById('miners-grid');
  container.innerHTML = miners.map(createMinerCard).join('');

  // Initial fetch
  miners.forEach(async (miner) => {
    const data = await fetchMinerData(miner);
    updateMinerCard(miner, data);
  });

  // Poll every 5 seconds
  setInterval(() => {
    miners.forEach(async (miner) => {
      const data = await fetchMinerData(miner);
      updateMinerCard(miner, data);
    });
  }, 5000);

  loadSecurityReport();
}

async function loadSecurityReport() {
  const container = document.getElementById('security-report');
  if (!container) return;

  try {
    // Try multiple possible paths
    const paths = [
      'security_report.md',          // Relative (works for Python server at root)
      '/security_report.md',         // Absolute root (Standard Vite)
      'public/security_report.md',   // Fallback location
      '/public/security_report.md'   // Absolute fallback
    ];

    let response = null;
    let successPath = '';

    for (const path of paths) {
      try {
        const r = await fetch(path);
        if (r.ok) {
          response = r;
          successPath = path;
          break;
        }
      } catch (e) {
        // Ignore fetch errors and try next
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to load security report. Tried paths: ${paths.join(', ')}`);
    }

    const text = await response.text();
    processReport(text, container);
  } catch (e) {
    console.error('Error loading security report:', e);
    container.innerHTML = `
        <div style="color: var(--error-color); padding: 1rem; border: 1px solid var(--error-color); border-radius: 8px;">
            <h3>Error Loading Report</h3>
            <p>${e.message}</p>
            <p>Please run the security scan to generate the report.</p>
        </div>`;
  }
}

function processReport(text, container) {
  // 1. Filter out ignored warnings
  const ignoredPatterns = [
    /Possible Hardcoded IP found/i,
    /Possible Private Key found/i
  ];

  const lines = text.split('\n');
  const filteredLines = lines.filter(line =>
    !ignoredPatterns.some(pattern => pattern.test(line))
  );
  // Rejoin. Trim to avoid excessive newlines if we stripped a lot
  const filteredText = filteredLines.join('\n').trim();

  // 2. Count warnings in filtered text
  const warningCount = (filteredText.match(/\[WARNING\]/g) || []).length;

  // 3. Hide if no warnings found (Smart Visibility)
  if (warningCount === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'block';

  // Summary Header
  const summaryText = `Security Scan Report: ${warningCount} Potential Issues Found`;
  const indicatorClass = 'indicator-warning';

  // 4. Markdown Parsing with Folding
  // Helper for basic markdown
  const simpleMarkdown = (md) => {
    return md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Note: H2 is handled by the section splitter below
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/```json([\s\S]*?)```/g, '<pre><code class="language-json">$1</code></pre>')
      .replace(/\[WARNING\]/g, '<span class="report-warning">[WARNING]</span>')
      .replace(/((?:^- .*(?:\r?\n|$))+)/gim, (match) => {
        const items = match.trim().split('\n')
          .map(line => `<li>${line.replace(/^- /, '')}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      });
  };

  // Remove main header from content processing as it's redundant
  const contentBody = filteredText.replace(/^# Security Scan Report\s*$/gim, '');

  // Split by Level 2 Headers (## ) to create sections
  // Using split with capture group to keep the headers or just processing chunks
  // Strategy: Split by `^## ` multiline.
  const sections = contentBody.split(/^## /m);

  let htmlContent = '';

  // The first chunk is the introduction (before any ##)
  if (sections[0].trim()) {
    htmlContent += `<div class="report-intro">${simpleMarkdown(sections[0])}</div>`;
  }

  // Subsequent chunks are the sections
  // sections[1] -> "Title\nContent..."
  for (let i = 1; i < sections.length; i++) {
    const sectionRaw = sections[i];
    const firstLineEnd = sectionRaw.indexOf('\n');

    // Fallback if no newline (header only)
    const title = firstLineEnd === -1 ? sectionRaw.trim() : sectionRaw.substring(0, firstLineEnd).trim();
    const body = firstLineEnd === -1 ? '' : sectionRaw.substring(firstLineEnd + 1);

    htmlContent += `
      <details class="report-section-details">
        <summary class="report-section-summary">${title}</summary>
        <div class="report-section-content">
            ${simpleMarkdown(body)}
        </div>
      </details>
    `;
  }

  container.innerHTML = `
    <details class="security-details" open>
      <summary class="security-summary">
        <span class="summary-indicator ${indicatorClass}"></span>
        <span class="summary-text">${summaryText}</span>
        <span class="summary-arrow">▼</span>
      </summary>
      <div class="report-content">
        ${htmlContent}
      </div>
    </details>
  `;
}

init();
