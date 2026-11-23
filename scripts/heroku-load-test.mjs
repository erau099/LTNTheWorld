import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const JAR_PATH = path.join(ROOT_DIR, 'lovethyneighbor-backend', 'target', 'lovethyneighbor-0.0.1-SNAPSHOT.jar');

const APP_PORT = 18090;
const MOCK_SMTP_PORT = 12525;
const MOCK_GEO_PORT = 12526;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;

const SIM_DURATION_MS = Number(process.env.SIM_DURATION_MS || 25000);
const CONCURRENT_WORKERS = Number(process.env.SIM_WORKERS || 20);
const TOTAL_DONORS = 6;
const TOTAL_RECIPIENTS = 14;
const LISTINGS_PER_DONOR = 5; // 30 total listings (20 active + 10 completed lifecycle)
const PHOTO_APPROX_BYTES = 180_000; // ~180 KB realistic resized 1024px JPEG base64 data URL

function makeFakeJpegDataUrl(seed, targetLength = PHOTO_APPROX_BYTES) {
  const header = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD${seed}`;
  const chunk = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let body = header;
  while (body.length < targetLength) {
    body += chunk.repeat(64);
  }
  return body.slice(0, targetLength);
}

// Lightweight in-memory SMTP sink to capture real signup verification tokens
function startMockSmtp(port) {
  const tokensByEmail = new Map();
  const server = net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    let dataBuffer = '';
    let rcptEmail = '';

    socket.write('220 localhost MockSMTP Ready\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      while (true) {
        if (inData) {
          const endIdx = buffer.indexOf('\r\n.\r\n');
          if (endIdx === -1) {
            dataBuffer += buffer;
            buffer = '';
            break;
          }
          dataBuffer += buffer.slice(0, endIdx);
          buffer = buffer.slice(endIdx + 5);
          inData = false;
          // Unwrap quoted-printable soft line breaks if any
          const normalized = dataBuffer.replace(/=\r?\n/g, '');
          const match = normalized.match(/verify-email\?token=([A-Za-z0-9_-]+)/);
          if (match && rcptEmail) {
            tokensByEmail.set(rcptEmail.toLowerCase(), match[1]);
          }
          dataBuffer = '';
          socket.write('250 2.0.0 OK\r\n');
        } else {
          const lineEnd = buffer.indexOf('\r\n');
          if (lineEnd === -1) break;
          const line = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 2);
          const upper = line.toUpperCase();
          if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
            socket.write('250-localhost\r\n250 OK\r\n');
          } else if (upper.startsWith('MAIL FROM')) {
            socket.write('250 OK\r\n');
          } else if (upper.startsWith('RCPT TO')) {
            const m = line.match(/<([^>]+)>/);
            if (m) rcptEmail = m[1];
            socket.write('250 OK\r\n');
          } else if (upper === 'DATA') {
            inData = true;
            dataBuffer = '';
            socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
          } else if (upper === 'QUIT') {
            socket.write('221 Bye\r\n');
            socket.end();
          } else {
            socket.write('250 OK\r\n');
          }
        }
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, tokensByEmail }));
  });
}

// Lightweight local Nominatim mock returning Sacramento-area coordinates
function startMockGeocoder(port) {
  let geoCount = 0;
  const server = http.createServer((req, res) => {
    geoCount += 1;
    const lat = (38.56 + (geoCount % 10) * 0.005).toFixed(6);
    const lon = (-121.50 + (geoCount % 10) * 0.005).toFixed(6);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ lat, lon, display_name: 'Sacramento, CA' }]));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function sampleJvmMemoryMb(childPid) {
  try {
    if (process.platform === 'win32') {
      const psCmd = `Get-CimInstance Win32_Process | Where-Object { ($_.ProcessId -eq ${childPid} -or $_.ParentProcessId -eq ${childPid} -or $_.CommandLine -like '*lovethyneighbor-0.0.1-SNAPSHOT.jar*') -and $_.Name -like 'java*' } | Sort-Object WorkingSetSize -Descending | Select-Object -First 1 ProcessId, Name, WorkingSetSize, PrivatePageCount | ConvertTo-Json -Compress`;
      const out = execFileSync('powershell', ['-NoProfile', '-Command', psCmd], { encoding: 'utf8' }).trim();
      if (!out) return null;
      const javaProc = JSON.parse(out);
      return {
        pid: javaProc.ProcessId,
        rssMb: +(Number(javaProc.WorkingSetSize) / (1024 * 1024)).toFixed(1),
        privateMb: +(Number(javaProc.PrivatePageCount) / (1024 * 1024)).toFixed(1),
      };
    }
    const status = execFileSync('cat', [`/proc/${childPid}/status`], { encoding: 'utf8' });
    const match = status.match(/VmRSS:\s+(\d+)\s+kB/);
    return match ? { pid: childPid, rssMb: +(Number(match[1]) / 1024).toFixed(1), privateMb: null } : null;
  } catch {
    return null;
  }
}

async function timedFetch(url, options = {}) {
  const start = performance.now();
  const res = await fetch(url, options);
  const text = await res.text();
  const ms = performance.now() - start;
  return { status: res.status, ok: res.ok, headers: res.headers, text, ms };
}

function extractAuthCookie(headers) {
  const raw = headers.getSetCookie ? headers.getSetCookie() : [];
  for (const cookie of raw) {
    if (cookie.startsWith('authToken=')) {
      return cookie.split(';')[0];
    }
  }
  return null;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  console.log('=== Heroku Basic Dyno Full-Stack Simulation ===');
  console.log(`Target JAR: ${JAR_PATH}`);

  const { server: smtpServer, tokensByEmail } = await startMockSmtp(MOCK_SMTP_PORT);
  const geoServer = await startMockGeocoder(MOCK_GEO_PORT);

  const jvmArgs = [
    `-Dserver.port=${APP_PORT}`,
    '-XX:MaxRAMPercentage=60.0',
    '-Xmx280m',
    '-XX:MaxMetaspaceSize=128m',
    '-jar',
    JAR_PATH,
    '--spring.datasource.url=jdbc:h2:mem:herokusim;DB_CLOSE_DELAY=-1;MODE=PostgreSQL',
    '--spring.datasource.driver-class-name=org.h2.Driver',
    '--spring.datasource.username=sa',
    '--spring.datasource.password=',
    '--spring.jpa.database-platform=org.hibernate.dialect.H2Dialect',
    '--spring.jpa.hibernate.ddl-auto=create-drop',
    '--spring.mail.host=127.0.0.1',
    `--spring.mail.port=${MOCK_SMTP_PORT}`,
    '--spring.mail.properties.mail.smtp.auth=false',
    '--spring.mail.properties.mail.smtp.starttls.enable=false',
    `--app.geocoding.url=http://127.0.0.1:${MOCK_GEO_PORT}/search`,
  ];

  const bootStart = performance.now();
  const child = spawn('java', jvmArgs, {
    cwd: path.join(ROOT_DIR, 'lovethyneighbor-backend'),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const serverLogs = [];
  child.stdout.on('data', (d) => serverLogs.push(d.toString('utf8')));
  child.stderr.on('data', (d) => serverLogs.push(d.toString('utf8')));

  const memSamples = [];
  let memTimer;

  try {
    // Wait for server health
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (child.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`${BASE_URL}/api/hello`);
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch {
        // Still booting
      }
    }
    if (!ready) {
      console.error('--- Server Startup Logs ---\n' + serverLogs.join(''));
    }
    assert.ok(ready, 'Heroku full-stack JAR failed to start within 20s');
    const bootMs = (performance.now() - bootStart).toFixed(0);
    const baselineMem = sampleJvmMemoryMb(child.pid);
    if (baselineMem) memSamples.push({ phase: 'baseline', ...baselineMem });
    console.log(`Server booted in ${bootMs} ms | Baseline JVM memory:`, baselineMem);

    // Phase 1: Verify bundled React frontend + service worker + security headers
    const rootRes = await timedFetch(`${BASE_URL}/`);
    assert.equal(rootRes.status, 200, 'GET / should return 200 without auth');
    const jsMatch = rootRes.text.match(/src="(\/assets\/[^"]+\.js)"/);
    const cssMatch = rootRes.text.match(/href="(\/assets\/[^"]+\.css)"/);
    assert.ok(jsMatch && cssMatch, 'index.html must reference built Vite JS and CSS assets');

    const [jsRes, cssRes, swRes] = await Promise.all([
      timedFetch(`${BASE_URL}${jsMatch[1]}`, { headers: { 'Accept-Encoding': 'gzip' } }),
      timedFetch(`${BASE_URL}${cssMatch[1]}`, { headers: { 'Accept-Encoding': 'gzip' } }),
      timedFetch(`${BASE_URL}/firebase-messaging-sw.js`),
    ]);
    assert.equal(jsRes.status, 200);
    assert.equal(cssRes.status, 200);
    assert.equal(swRes.status, 200);
    assert.ok(!swRes.text.includes('YOUR_APP_ID'), 'firebase-messaging-sw.js must not contain YOUR_APP_ID placeholder');
    console.log(`Static frontend verified (/, ${jsMatch[1]}, ${cssMatch[1]}, /firebase-messaging-sw.js)`);

    // Phase 2: Provision realistic local userbase (donors + recipients) & listings with photos
    const futureDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const donors = [];
    const recipients = [];

    async function createVerifiedUser(role, idx) {
      const email = `${role}${idx}@herokusim.local`;
      const password = 'Password123!';
      const signup = await timedFetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: role === 'donor' ? `Donor${idx}` : `Recipient${idx}`,
          lastName: 'Sim',
          email,
          password,
          dateOfBirth: '1993-04-15',
          phoneNumber: `555-010-${String(idx).padStart(2, '0')}`,
          role,
        }),
      });
      assert.equal(signup.status, 200, `Signup failed for ${email}: ${signup.text}`);

      const token = tokensByEmail.get(email);
      assert.ok(token, `Verification token not received via SMTP for ${email}`);

      const verify = await timedFetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      assert.equal(verify.status, 200, `Email verification failed for ${email}`);

      const login = await timedFetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      assert.equal(login.status, 200, `Login failed for ${email}: ${login.text}`);
      const cookie = extractAuthCookie(login.headers);
      assert.ok(cookie, `Missing authToken cookie for ${email}`);
      return { email, cookie, role };
    }

    for (let i = 1; i <= TOTAL_DONORS; i++) donors.push(await createVerifiedUser('donor', i));
    for (let i = 1; i <= TOTAL_RECIPIENTS; i++) recipients.push(await createVerifiedUser('recipient', i));

    // Verify admin endpoint protection before load phase
    const unauthAdmin = await timedFetch(`${BASE_URL}/api/admin/stats`);
    assert.equal(unauthAdmin.status, 401, 'Unauthenticated /api/admin/stats must be 401');
    const donorAdmin = await timedFetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: donors[0].cookie },
    });
    assert.equal(donorAdmin.status, 403, 'Donor /api/admin/stats must be 403');

    // Create 30 listings with 2 realistic JPEG photos each (~360 KB per listing)
    const createdListings = [];
    const photoA = makeFakeJpegDataUrl('A');
    const photoB = makeFakeJpegDataUrl('B');

    for (let d = 0; d < donors.length; d++) {
      for (let k = 0; k < LISTINGS_PER_DONOR; k++) {
        const streetNum = 100 + d * 10 + k;
        const secretStreet = `${streetNum} Secret Elm St`;
        const res = await timedFetch(`${BASE_URL}/api/food`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: donors[d].cookie,
          },
          body: JSON.stringify({
            foodItem: `Community Meal Box ${d}-${k}`,
            description: 'Freshly prepared produce and baked goods',
            tags: ['Fresh / Hot'],
            allergens: k % 2 === 0 ? ['Wheat'] : [],
            address: `${secretStreet}, Sacramento, CA 95819`,
            date: futureDate,
            startTime: '10:00',
            endTime: '14:00',
            photos: [photoA, photoB],
          }),
        });
        assert.equal(res.status, 200, `Listing creation failed: ${res.text}`);
        const food = JSON.parse(res.text);
        createdListings.push({ food, donor: donors[d], secretStreet });
      }
    }

    // Exercise claim -> approve -> complete -> review lifecycle on first 10 listings
    for (let i = 0; i < 10; i++) {
      const item = createdListings[i];
      const rec = recipients[i];

      const claimRes = await timedFetch(`${BASE_URL}/api/food/${item.food.id}/request`, {
        method: 'POST',
        headers: { Cookie: rec.cookie },
      });
      assert.equal(claimRes.status, 200, `Claim failed for food ${item.food.id}: ${claimRes.text}`);

      // Verify claimed (unapproved) recipient still sees masked address on GET /api/food/{id}
      const preApprove = await timedFetch(`${BASE_URL}/api/food/${item.food.id}`, {
        headers: { Cookie: rec.cookie },
      });
      assert.equal(preApprove.status, 200);
      assert.ok(!preApprove.text.includes(item.secretStreet), 'Address leaked before donor approval!');

      const approveRes = await timedFetch(`${BASE_URL}/api/food/${item.food.id}/confirm-pickup`, {
        method: 'PATCH',
        headers: { Cookie: item.donor.cookie },
      });
      assert.equal(approveRes.status, 200, `Confirm pickup failed: ${approveRes.text}`);

      // Verify approved recipient sees full street address & directions link
      const postApprove = await timedFetch(`${BASE_URL}/api/food/${item.food.id}`, {
        headers: { Cookie: rec.cookie },
      });
      assert.equal(postApprove.status, 200);
      assert.ok(postApprove.text.includes(item.secretStreet), 'Approved recipient should see full street address');

      const ordersRes = await timedFetch(`${BASE_URL}/api/recipient/orders`, {
        headers: { Cookie: rec.cookie },
      });
      assert.equal(ordersRes.status, 200);
      assert.ok(ordersRes.text.includes('google.com/maps/dir'), 'Approved order must include Google Maps directions link');

      const completeRes = await timedFetch(`${BASE_URL}/api/food/${item.food.id}/complete-pickup`, {
        method: 'PATCH',
        headers: { Cookie: item.donor.cookie },
      });
      assert.equal(completeRes.status, 200);

      const reviewRes = await timedFetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: rec.cookie,
        },
        body: JSON.stringify({
          foodId: item.food.id,
          rating: 5,
          comment: 'Great pickup coordination!',
        }),
      });
      assert.equal(reviewRes.status, 200, `Review failed: ${reviewRes.text}`);
    }

    // Verify public GET /api/food masks all 20 active listings
    const publicFeed = await timedFetch(`${BASE_URL}/api/food?lat=38.5816&lng=-121.4944&radiusMiles=25`);
    assert.equal(publicFeed.status, 200);
    const activeItems = JSON.parse(publicFeed.text);
    assert.equal(activeItems.length, 20, 'Expected 20 active listings remaining');
    for (const item of activeItems) {
      assert.ok(!/^\d+\s+Secret/.test(item.address), `Public listing ${item.id} leaked street address: ${item.address}`);
    }

    const seededMem = sampleJvmMemoryMb(child.pid);
    if (seededMem) memSamples.push({ phase: 'post-seed', ...seededMem });
    console.log(`Provisioned ${donors.length} donors, ${recipients.length} recipients, 30 photo listings (20 active, 10 completed+reviewed) | Memory:`, seededMem);

    // Phase 3: Concurrent realistic userbase simulation
    const latencies = [];
    const statusCounts = new Map();
    let unexpectedErrors = 0;
    const activeIds = activeItems.map((f) => f.id);

    memTimer = setInterval(() => {
      const sample = sampleJvmMemoryMb(child.pid);
      if (sample) memSamples.push({ phase: 'load', ...sample });
    }, 3000);

    const endAt = Date.now() + SIM_DURATION_MS;
    async function worker(workerId) {
      let step = 0;
      while (Date.now() < endAt) {
        step += 1;
        const isDonor = workerId < TOTAL_DONORS;
        const actor = isDonor ? donors[workerId] : recipients[(workerId - TOTAL_DONORS) % recipients.length];
        let res;
        try {
          if (isDonor) {
            if (step % 3 === 0) {
              res = await timedFetch(`${BASE_URL}/api/notifications/unread-count`, { headers: { Cookie: actor.cookie } });
            } else if (step % 3 === 1) {
              res = await timedFetch(`${BASE_URL}/api/food/mine`, { headers: { Cookie: actor.cookie } });
            } else {
              res = await timedFetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: actor.cookie } });
            }
          } else {
            const mod = step % 6;
            if (mod === 0) {
              res = await timedFetch(`${BASE_URL}/api/food?lat=38.5816&lng=-121.4944&radiusMiles=10`, {
                headers: { Cookie: actor.cookie, 'Accept-Encoding': 'gzip' },
              });
            } else if (mod === 1) {
              const targetId = activeIds[step % activeIds.length];
              res = await timedFetch(`${BASE_URL}/api/food/${targetId}`, { headers: { Cookie: actor.cookie } });
            } else if (mod === 2) {
              res = await timedFetch(`${BASE_URL}/api/notifications`, { headers: { Cookie: actor.cookie } });
            } else if (mod === 3) {
              res = await timedFetch(`${BASE_URL}/api/notifications/unread-count`, { headers: { Cookie: actor.cookie } });
            } else if (mod === 4) {
              res = await timedFetch(`${BASE_URL}/api/recipient/orders`, { headers: { Cookie: actor.cookie } });
            } else {
              res = await timedFetch(`${BASE_URL}/api/orders/mine`, { headers: { Cookie: actor.cookie } });
            }
          }
          latencies.push(res.ms);
          statusCounts.set(res.status, (statusCounts.get(res.status) || 0) + 1);
          if (res.status >= 500) unexpectedErrors += 1;
        } catch (err) {
          unexpectedErrors += 1;
          console.error(`Worker ${workerId} network error:`, err.message);
        }
        // Small realistic pause between user/polling actions (100-250ms compressed time)
        await new Promise((r) => setTimeout(r, 100 + ((workerId * 37 + step * 13) % 150)));
      }
    }

    const loadStart = performance.now();
    await Promise.all(Array.from({ length: CONCURRENT_WORKERS }, (_, idx) => worker(idx)));
    const elapsedSec = (performance.now() - loadStart) / 1000;

    clearInterval(memTimer);
    await new Promise((r) => setTimeout(r, 1000));
    const finalMem = sampleJvmMemoryMb(child.pid);
    if (finalMem) memSamples.push({ phase: 'post-load', ...finalMem });

    latencies.sort((a, b) => a - b);
    const totalReq = latencies.length;
    const avgMs = totalReq ? latencies.reduce((a, b) => a + b, 0) / totalReq : 0;
    const peakRssMb = Math.max(...memSamples.map((m) => m.rssMb));
    const peakPrivateMb = Math.max(...memSamples.filter((m) => m.privateMb != null).map((m) => m.privateMb), 0);

    console.log('\n=== Simulation Summary ===');
    console.log(`Duration: ${elapsedSec.toFixed(1)} s | Concurrent virtual users: ${CONCURRENT_WORKERS}`);
    console.log(`Total requests: ${totalReq} (${(totalReq / elapsedSec).toFixed(1)} req/s) | 5xx/network errors: ${unexpectedErrors}`);
    console.log('Status breakdown:', Object.fromEntries(statusCounts));
    console.log(`Latency (ms): avg=${avgMs.toFixed(1)}, p50=${percentile(latencies, 50).toFixed(1)}, p95=${percentile(latencies, 95).toFixed(1)}, max=${percentile(latencies, 100).toFixed(1)}`);
    console.log(`Memory (MB): baseline=${baselineMem?.rssMb ?? 'n/a'} RSS | peak=${peakRssMb} RSS (private=${peakPrivateMb}) | final=${finalMem?.rssMb ?? 'n/a'} RSS | Basic dyno limit=512 MB`);

    const combinedLogs = serverLogs.join('');
    const hasOom = /OutOfMemoryError|LazyInitializationException|Unable to acquire JDBC Connection/i.test(combinedLogs);
    assert.equal(unexpectedErrors, 0, 'Simulation recorded 5xx or network errors');
    assert.ok(!hasOom, 'Server logs reported OOM, LazyInitializationException, or JDBC pool exhaustion');
    assert.ok(peakRssMb < 512, `Peak RSS ${peakRssMb} MB exceeded Heroku Basic 512 MB limit!`);
    console.log('PASS: Zero 5xx/OOM/JDBC errors and memory stayed within Heroku Basic 512 MB budget.');
  } finally {
    if (memTimer) clearInterval(memTimer);
    if (child.pid) {
      if (process.platform === 'win32') {
        try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
      } else if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
    smtpServer.close();
    geoServer.close();
  }
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
