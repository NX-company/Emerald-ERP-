import { db } from './db';
import { users, dealStages, roles, role_permissions } from '@shared/schema';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding...');

  // Create "Замерщик" role or get existing
  let measurerRole = await db.select().from(roles).where(eq(roles.name, 'Замерщик')).limit(1);
  let measurerRoleId: string;

  if (measurerRole.length === 0) {
    measurerRoleId = nanoid();
    await db.insert(roles).values({
      id: measurerRoleId,
      name: 'Замерщик',
      description: 'Роль для замерщиков - доступ только к проектам и этапам замера',
      is_system: true,
    });
    console.log('✅ Role "Замерщик" created');
  } else {
    measurerRoleId = measurerRole[0].id;
    console.log('✅ Role "Замерщик" already exists');
  }

  // Create permissions for "Замерщик" role - only projects access
  const existingPermissions = await db.select()
    .from(role_permissions)
    .where(eq(role_permissions.role_id, measurerRoleId))
    .limit(1);

  if (existingPermissions.length === 0) {
    await db.insert(role_permissions).values([
      {
        id: nanoid(),
        role_id: measurerRoleId,
        module: 'projects',
        can_view: true,
        can_create: false,
        can_edit: true,  // can edit only measurement stages
        can_delete: false,
        view_all: false,  // only assigned projects
      },
    ]);
    console.log('✅ Permissions for "Замерщик" role created');
  } else {
    console.log('✅ Permissions for "Замерщик" role already exist');
  }

  // Create measurer user
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.username, 'zamerschik'))
    .limit(1);

  if (existingUser.length === 0) {
    const hashedPasswordMeasurer = await bcrypt.hash('zamerschik123', 10);
    await db.insert(users).values({
      id: nanoid(),
      username: 'zamerschik',
      password: hashedPasswordMeasurer,
      email: 'zamerschik@emeralderp.com',
      full_name: 'Замерщик',
      role_id: measurerRoleId,
      phone: '+7999123456',
      is_active: true,
    });
    console.log('✅ Measurer user created: username=zamerschik, password=zamerschik123');
  } else {
    console.log('✅ Measurer user already exists: username=zamerschik');
  }

  // Note: Deal stages are now created per pipeline, not globally
  // This old code is commented out as it requires pipeline_id

  console.log('🎉 Seeding completed successfully!');
}

seed().catch(console.error);
