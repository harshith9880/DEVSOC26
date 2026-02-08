require('dotenv').config();

console.log('Starting server.js');

let app;
try {
  app = require('./app');
  console.log('Loaded app.js');
} catch (e) {
  console.error('Error loading app.js:', e);
  process.exit(1);
}

let connectDB;
try {
  connectDB = require('./config/db');
  console.log('Loaded db.js');
} catch (e) {
  console.error('Error loading db.js:', e);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('Connecting to DB...');
    await connectDB();
    console.log('DB connected, starting server...');

    app.listen(PORT, () => {
      console.log(`🚀 Decision Intelligence Engine running on port ${PORT}`);
      console.log(`📊 Observation endpoints active`);
      console.log(`🧠 Intelligence processing ready`);
    });
  } catch (e) {
    console.error('Failed during startup:', e);
    process.exit(1);
  }
})();