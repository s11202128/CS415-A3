require('dotenv').config();
const sequelize = require('../src/config/database');

async function migrate() {
  try {
    console.log('Running migration: add payment_method and payment_source_id columns to bills');
    
    await sequelize.query(
      `ALTER TABLE bills ADD COLUMN payment_method VARCHAR(20) DEFAULT 'account' AFTER recurrence`
    );
    console.log('✓ Added payment_method column');
    
    await sequelize.query(
      `ALTER TABLE bills ADD COLUMN payment_source_id VARCHAR(255) AFTER payment_method`
    );
    console.log('✓ Added payment_source_id column');
    
    console.log('OK: payment_method and payment_source_id columns added successfully');
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('OK: Columns already exist, migration skipped');
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
