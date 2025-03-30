const Property = require('../../../models/property');
const cron = require('node-cron');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  
  await Property.deleteMany({ 
    status: 'rejected',
    submitted_at: { $lt: cutoff }
  });
  console.log('Cleaned up rejected properties');
});