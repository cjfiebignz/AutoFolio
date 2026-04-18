const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let currentSession = null;

// Helper to format date for filename
function getTimestampForFilename() {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
}

// Helper to format events for log file
function formatLogFile(session) {
  let content = `================================================================================\n`;
  content += `AUTO-FOLIO DIAGNOSTIC LOG\n`;
  content += `================================================================================\n`;
  content += `Session Start: ${new Date(session.startTime).toLocaleString()}\n`;
  content += `Session End:   ${new Date(session.endTime).toLocaleString()}\n`;
  content += `Duration:      ${Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)} seconds\n`;
  content += `Total Events:  ${session.events.length}\n`;
  content += `================================================================================\n\n`;

  content += `EVENT TRACE\n`;
  content += `-----------\n\n`;

  session.events.forEach((event, index) => {
    const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const type = event.type.toUpperCase().padEnd(12);
    
    content += `[${time}] ${type} | `;

    if (event.type === 'request') {
      const { method, url, status, duration } = event.data;
      content += `${method} ${url} -> Status: ${status} (${duration})\n`;
    } else if (event.type === 'route') {
      content += `NAVIGATED TO: ${event.data.path}\n`;
    } else if (event.type === 'note') {
      content += `USER NOTE: ${event.data.text}\n`;
    } else if (event.type === 'error' || event.type === 'warn' || event.type === 'exception') {
      content += `${JSON.stringify(event.data)}\n`;
      content += `             └─ ATTENTION REQUIRED\n`;
    } else {
      content += `${JSON.stringify(event.data)}\n`;
    }
  });

  content += `\n================================================================================\n`;
  content += `END OF LOG\n`;
  content += `================================================================================\n`;

  return content;
}

app.post('/api/session/start', (req, res) => {
  currentSession = {
    startTime: new Date().toISOString(),
    events: [],
    isActive: true
  };
  console.log('Debug Session Started');
  res.json({ message: 'Session started', startTime: currentSession.startTime });
});

app.post('/api/log', (req, res) => {
  const { type, data } = req.body;
  console.log(`[INCOMING] Type: ${type}`);

  if (!currentSession || !currentSession.isActive) {
    console.log(`[REJECTED] No active session for event: ${type}`);
    return res.status(400).json({ error: 'No active session' });
  }

  const event = {
    timestamp: new Date().toISOString(),
    type: type || 'info',
    data: data || {}
  };

  currentSession.events.push(event);
  res.json({ status: 'logged' });
});

app.post('/api/session/stop', (req, res) => {
  if (!currentSession) {
    return res.status(400).json({ error: 'No session to stop' });
  }

  currentSession.endTime = new Date().toISOString();
  currentSession.isActive = false;

  const timestamp = getTimestampForFilename();
  
  // Save ONLY Human-Readable Text Version
  const logContent = formatLogFile(currentSession);
  const txtFilename = `autofolio-debug-${timestamp}.txt`;
  const txtPath = path.join(__dirname, 'Debug Logs', txtFilename);
  fs.writeFileSync(txtPath, logContent);
  
  console.log(`Session saved as: ${txtFilename}`);
  res.json({ 
    message: 'Session saved', 
    txt: txtFilename
  });
});

app.post('/api/session/clear', (req, res) => {
  currentSession = null;
  res.json({ message: 'Session cleared' });
});

app.get('/api/session/status', (req, res) => {
  res.json({ 
    active: !!currentSession?.isActive,
    eventCount: currentSession?.events.length || 0,
    startTime: currentSession?.startTime || null
  });
});

app.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`AutoFolio Debug Tool running at:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`==========================================\n`);
});
