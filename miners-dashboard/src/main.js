const miners = [
  { name: 'nerdqaxe++', ip: '192.168.0.154', id: 'nerdqaxe' },
  { name: 'ak-bitaxe', ip: '192.168.0.157', id: 'ak-bitaxe' },
  { name: 'ck-bitaxe', ip: '192.168.0.156', id: 'ck-bitaxe' },
];

async function fetchMinerData(miner) {
  try {
    // Revert to Proxy as Direct Connection failed for some miners
    // The proxy now handles User-Agent headers to avoid blocks
    const response = await fetch(`/proxy/${miner.ip}/api/system/info`, {
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!response.ok) {
      console.error(`Error fetching ${miner.name}: Status ${response.status}`);
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log(`Success ${miner.name}:`, data);
    return { ...data, status: 'online' };
  } catch (error) {
    console.error(`Failed to fetch ${miner.name}:`, error);
    return { status: 'offline' };
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
          <span class="stat-label">Temp</span>
          <div class="stat-value" id="temp-${miner.id}">-- <span class="unit">°C</span></div>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">Efficiency</span>
          <div class="stat-value" id="eff-${miner.id}">-- <span class="unit">J/TH</span></div>
        </div>
      </div>

      <div class="extended-stats">
        <div class="ext-stat-item">
            <span class="ext-stat-label">Uptime</span>
            <span class="ext-stat-value" id="uptime-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Voltage</span>
            <span class="ext-stat-value" id="volts-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Frequency</span>
            <span class="ext-stat-value" id="freq-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Fan</span>
            <span class="ext-stat-value" id="fan-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Best Share</span>
            <span class="ext-stat-value" id="best-${miner.id}">--</span>
        </div>
        <div class="ext-stat-item">
            <span class="ext-stat-label">Rejected</span>
            <span class="ext-stat-value" id="rej-${miner.id}">--</span>
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

function updateMinerCard(miner, data) {
  const card = document.getElementById(`card-${miner.id}`);
  const statusEl = document.getElementById(`status-${miner.id}`);
  const loadingEl = document.getElementById(`loading-${miner.id}`);

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
    document.getElementById(`temp-${miner.id}`).innerHTML = `-- <span class="unit">°C</span>`;
    document.getElementById(`eff-${miner.id}`).innerHTML = `-- <span class="unit">J/TH</span>`;

    document.getElementById(`uptime-${miner.id}`).textContent = '--';
    document.getElementById(`volts-${miner.id}`).textContent = '--';
    document.getElementById(`freq-${miner.id}`).textContent = '--';
    document.getElementById(`fan-${miner.id}`).textContent = '--';
    document.getElementById(`best-${miner.id}`).textContent = '--';
    document.getElementById(`rej-${miner.id}`).textContent = '--';
    return;
  }

  card.classList.remove('offline');
  statusEl.className = 'miner-status status-active';
  statusEl.textContent = 'ACTIVE';

  // Update stats - Note: Adjusting field access based on standard Bitaxe API response structure
  // Typically: hashrate is often in gh/s or similar in `hashRate` or similar fields.
  // Since I don't have the exact JSON schema, I will use safe fallbacks or typical keys
  // Based on research: /api/system/info returns basics. /api/system/stats might be better for hashrate.
  // Let's assume info has what we need or we might need to hit /api/system/statistics

  // Fallback or actual fields (mocked slightly until I see real data)
  // Common Bitaxe fields: temp, power, hashrate

  const hashrate = data.hashRate || data.hashrate || 0;
  const power = data.power || 0;
  const temp = data.temp || data.temperature || 0;
  const efficiency = hashrate > 0 ? (power / (hashrate / 1000)).toFixed(2) : 0; // W / (TH/s)

  // Extended Stats
  const uptime = data.uptime || data.Seconds || 0;
  const volts = data.voltage || data.volts || 0;
  const freq = data.frequency || data.freq || 0;
  const fan = data.fanSpeed || data.fan_duty || data.fan || 0;
  const bestShare = data.bestShare || data.best_share || 0;
  // shares can be boolean or number or object in some versions
  const rejected = data.sharesRejected || data.rejected || 0;

  document.getElementById(`hash-${miner.id}`).innerHTML = `${Math.round(hashrate)} <span class="unit">GH/s</span>`;
  document.getElementById(`power-${miner.id}`).innerHTML = `${Math.round(power)} <span class="unit">W</span>`;
  document.getElementById(`temp-${miner.id}`).innerHTML = `${Math.round(temp)} <span class="unit">°C</span>`;
  document.getElementById(`eff-${miner.id}`).innerHTML = `${efficiency} <span class="unit">J/TH</span>`;

  document.getElementById(`uptime-${miner.id}`).textContent = formatUptime(uptime);
  document.getElementById(`volts-${miner.id}`).textContent = volts ? `${(volts / 1000).toFixed(2)} V` : '--'; // Assuming mV usually
  document.getElementById(`freq-${miner.id}`).textContent = freq ? `${freq} MHz` : '--';
  document.getElementById(`fan-${miner.id}`).textContent = fan ? `${fan}%` : '--';
  document.getElementById(`best-${miner.id}`).textContent = bestShare > 0 ? bestShare : '--';
  document.getElementById(`rej-${miner.id}`).textContent = rejected;

  // Optional: Check if voltage is likely in V instead of mV (if < 10)
  if (volts > 0 && volts < 10) {
    document.getElementById(`volts-${miner.id}`).textContent = `${volts.toFixed(2)} V`;
  }
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
}

init();
