const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Security: Validate admin token is set
if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN environment variable is required');
  process.exit(1);
}

// Authentication middleware
function authenticate(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⚠️ Auth failed: Missing or invalid Authorization header');
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authorization header required' }));
    return false;
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  if (token !== ADMIN_TOKEN) {
    console.warn('⚠️ Auth failed: Invalid token');
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid token' }));
    return false;
  }
  
  return true;
}

// Helper function to validate file paths
function validateJsonPath(filename) {
  // Only allow files in src/data/pseo/ directory
  const allowedDir = path.resolve('/app/src/data/pseo');
  const filePath = path.resolve('/app/src/data/pseo', filename);
  
  if (!filePath.startsWith(allowedDir)) {
    return false;
  }
  
  // Only allow .json files
  if (!filename.endsWith('.json')) {
    return false;
  }
  
  return true;
}

// POST /api/admin/rebuild - Trigger PSEO rebuild
async function handleRebuild(req, res) {
  if (!authenticate(req, res)) return;
  
  console.log('🔄 Starting PSEO rebuild...');
  
  // Respond immediately with 202 Accepted
  res.writeHead(202, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Rebuild started',
    status: 'processing'
  }));
  
  // Start rebuild process in background
  const buildEnv = { ...process.env, RENDER_PSEO: 'true' };
  const build = spawn('npm', ['run', 'build'], {
    env: buildEnv,
    cwd: '/app',
    stdio: 'pipe'
  });
  
  let buildOutput = '';
  let buildError = '';
  
  build.stdout.on('data', (data) => {
    buildOutput += data.toString();
  });
  
  build.stderr.on('data', (data) => {
    buildError += data.toString();
  });
  
  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ PSEO rebuild completed successfully');
      
      // Hot-swap the new build
      const rsync = spawn('rsync', [
        '--delete',
        '-a',
        '/tmp/dist-new/',
        '/app/dist/'
      ]);
      
      rsync.on('close', (rsyncCode) => {
        if (rsyncCode === 0) {
          console.log('🔄 Hot-swap completed successfully');
        } else {
          console.error('❌ Hot-swap failed');
        }
      });
      
    } else {
      console.error('❌ PSEO rebuild failed');
      console.error('Build error:', buildError);
    }
  });
}

// POST /api/admin/update-json - Update JSON data files
function handleUpdateJson(req, res) {
  if (!authenticate(req, res)) return;
  
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const { filename, content } = JSON.parse(body);
      
      if (!filename || !content) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'filename and content are required' }));
        return;
      }
      
      if (!validateJsonPath(filename)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid file path' }));
        return;
      }
      
      const filePath = path.join('/app/src/data/pseo', filename);
      const dirPath = path.dirname(filePath);
      
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      
      console.log(`📝 Updated JSON file: ${filename}`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'File updated successfully',
        filename 
      }));
      
    } catch (error) {
      console.error('❌ JSON update failed:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

// Request router
const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Route handling
  if (path === '/api/admin/rebuild' && req.method === 'POST') {
    handleRebuild(req, res);
  } else if (path === '/api/admin/update-json' && req.method === 'POST') {
    handleUpdateJson(req, res);
  } else {
    // Return 404 for all other routes (nginx will handle static 404s)
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Admin API server running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/admin/rebuild`);
  console.log(`   POST /api/admin/update-json`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
