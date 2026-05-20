const fs = require('fs');
const path = require('path');

try {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('Prisma schema file not found at:', schemaPath);
    process.exit(1);
  }

  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const databaseUrl = process.env.DATABASE_URL || '';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

  if (isPostgres) {
    console.log('Detected PostgreSQL DATABASE_URL. Rewriting prisma provider to "postgresql"...');
    // Replace provider
    schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schemaContent);
    console.log('Successfully prepared prisma/schema.prisma for PostgreSQL.');
  } else {
    console.log('Using standard SQLite database configuration.');
  }
} catch (error) {
  console.error('Error preparing database schema:', error);
  process.exit(1);
}
