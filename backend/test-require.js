// Clean require test - try intelligence routes
try {
  delete require.cache[require.resolve('./routes/intelligence.routes')];

  const intelligenceRoutes = require('./routes/intelligence.routes');

  console.log('intelligenceRoutes type:', typeof intelligenceRoutes);
  console.log('intelligenceRoutes keys:', Object.keys(intelligenceRoutes));
  console.log('intelligenceRoutes _router:', intelligenceRoutes._router);
  console.log('Full object:', intelligenceRoutes);
  console.log('Has post method:', typeof intelligenceRoutes.post);
  console.log('Has get method:', typeof intelligenceRoutes.get);
  
} catch (e) {
  console.log('ERROR:', e.message);
  console.log(e.stack);
}
