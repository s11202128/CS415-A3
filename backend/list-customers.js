#!/usr/bin/env node
/**
 * List all customers in database
 */
require('dotenv').config();
const sequelize = require('./src/config/database');
const { Customer } = require('./src/models');

async function listCustomers() {
  try {
    await sequelize.authenticate();
    console.log('\n=== ALL CUSTOMERS IN DATABASE ===\n');
    
    const users = await Customer.findAll({
      attributes: ['id', 'email', 'fullName', 'emailVerified', 'registrationStatus', 'status'],
      order: [['id', 'ASC']],
      raw: true
    });
    
    if (users.length === 0) {
      console.log('❌ NO USERS FOUND');
      console.log('\nRun this to create test accounts:');
      console.log('  node create-admin.js\n');
      process.exit(0);
    }
    
    console.log(`Found ${users.length} customer(s):\n`);
    users.forEach((u, idx) => {
      console.log(`${idx + 1}. Email: ${u.email}`);
      console.log(`   Name: ${u.fullName}`);
      console.log(`   Verified: ${u.emailVerified ? '✓ YES' : '✗ NO'}`);
      console.log(`   Status: ${u.registrationStatus} (${u.status})`);
      console.log();
    });
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

listCustomers();
