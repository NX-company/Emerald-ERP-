import { migrateRolesAndPermissions } from './migrations/add_roles_and_permissions';

console.log('Starting roles and permissions migration...');

migrateRolesAndPermissions()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
