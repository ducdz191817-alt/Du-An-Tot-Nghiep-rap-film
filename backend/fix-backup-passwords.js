const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function fixBackupPasswords() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);

  const backupPath = path.join(__dirname, 'data', 'db-backup', 'users.json');
  const users = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  users.forEach(u => { u.password = hash; });
  fs.writeFileSync(backupPath, JSON.stringify(users, null, 2));
  console.log('✅ Fixed backup users.json — password: password123');
}

fixBackupPasswords().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
