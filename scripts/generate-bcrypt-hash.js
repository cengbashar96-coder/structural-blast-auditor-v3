// Generate bcrypt hash for the new admin password
const bcrypt = require('bcryptjs');

const newPassword = 'REDACTED_ADMIN_PASSWORD';
const saltRounds = 12;

const hash = bcrypt.hashSync(newPassword, saltRounds);
console.log('Password:', newPassword);
console.log('Hash:', hash);

// Verify the hash works
const verify = bcrypt.compareSync(newPassword, hash);
console.log('Verification:', verify ? 'OK' : 'FAILED');
