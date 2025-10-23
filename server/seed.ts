import { db } from './db';
import { users, dealStages } from '@shared/schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seeding...');

  // Create test user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await db.insert(users).values({
    username: 'admin',
    password: hashedPassword,
    email: 'admin@emeralderp.com',
    full_name: 'Admin User',
    role: 'admin',
    phone: '+1234567890',
    can_create_deals: 1,
    can_edit_deals: 1,
    can_delete_deals: 1,
  }).onConflictDoNothing();

  console.log('✅ Test user created: username=admin, password=admin123');

  // Create default deal stages
  const stages = [
    { name: 'Новый', key: 'new', color: '#3b82f6', order: 1 },
    { name: 'Встреча', key: 'meeting', color: '#8b5cf6', order: 2 },
    { name: 'Предложение', key: 'proposal', color: '#f59e0b', order: 3 },
    { name: 'Договор', key: 'contract', color: '#10b981', order: 4 },
    { name: 'Выиграно', key: 'won', color: '#22c55e', order: 5 },
    { name: 'Проиграно', key: 'lost', color: '#ef4444', order: 6 },
  ];

  for (const stage of stages) {
    await db.insert(dealStages).values(stage).onConflictDoNothing();
  }

  console.log('✅ Default deal stages created');
  console.log('🎉 Seeding completed successfully!');
}

seed().catch(console.error);
