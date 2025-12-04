// Temporary start script: Fix admin then start server
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function startWithFix() {
  try {
    console.log('🔧 Running admin fix...');
    
    // Run fix admin script
    const { stdout, stderr } = await execPromise('node src/seeders/fixAdminPassword.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Admin fix completed, starting server...');
    
    // Start main server
    require('./server.js');
  } catch (error) {
    console.error('❌ Error during startup:', error.message);
    // Start server anyway
    require('./server.js');
  }
}

startWithFix();
