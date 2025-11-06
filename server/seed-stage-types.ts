import { db } from './db';
import { stage_types, process_templates } from '@shared/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

async function seedStageTypes() {
  console.log('🌱 Seeding stage types and templates...');

  // Standard stage types
  const stageTypesData = [
    {
      code: 'measurement',
      name: 'Замер',
      icon: '📏',
      description: 'Этап замера помещения',
      is_active: true,
    },
    {
      code: 'production',
      name: 'Производство',
      icon: '🏭',
      description: 'Этап производства мебели',
      is_active: true,
    },
    {
      code: 'installation',
      name: 'Монтаж',
      icon: '🔨',
      description: 'Этап монтажа',
      is_active: true,
    },
    {
      code: 'delivery',
      name: 'Доставка',
      icon: '🚚',
      description: 'Этап доставки',
      is_active: true,
    },
  ];

  // Insert stage types
  for (const stageType of stageTypesData) {
    const existing = await db
      .select()
      .from(stage_types)
      .where(eq(stage_types.code, stageType.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(stage_types).values({
        id: nanoid(),
        ...stageType,
      });
      console.log(`✅ Stage type "${stageType.name}" (${stageType.code}) created`);
    } else {
      console.log(`✅ Stage type "${stageType.name}" (${stageType.code}) already exists`);
    }
  }

  // Get stage type IDs
  const measurementType = await db
    .select()
    .from(stage_types)
    .where(eq(stage_types.code, 'measurement'))
    .limit(1);

  const productionType = await db
    .select()
    .from(stage_types)
    .where(eq(stage_types.code, 'production'))
    .limit(1);

  const installationType = await db
    .select()
    .from(stage_types)
    .where(eq(stage_types.code, 'installation'))
    .limit(1);

  const deliveryType = await db
    .select()
    .from(stage_types)
    .where(eq(stage_types.code, 'delivery'))
    .limit(1);

  // Create default templates
  const templatesData = [
    {
      name: 'Замер квартиры',
      description: 'Стандартный шаблон для замера квартиры',
      is_active: true,
      stages: [
        {
          name: 'Замер',
          stage_type_id: measurementType[0]?.id,
          order: 1,
        },
      ],
    },
    {
      name: 'Полный цикл (Замер + Производство + Монтаж)',
      description: 'Полный цикл работы от замера до монтажа',
      is_active: true,
      stages: [
        {
          name: 'Замер',
          stage_type_id: measurementType[0]?.id,
          order: 1,
        },
        {
          name: 'Производство',
          stage_type_id: productionType[0]?.id,
          order: 2,
        },
        {
          name: 'Доставка',
          stage_type_id: deliveryType[0]?.id,
          order: 3,
        },
        {
          name: 'Монтаж',
          stage_type_id: installationType[0]?.id,
          order: 4,
        },
      ],
    },
  ];

  for (const template of templatesData) {
    const existing = await db
      .select()
      .from(process_templates)
      .where(eq(process_templates.name, template.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(process_templates).values({
        id: nanoid(),
        name: template.name,
        description: template.description,
        is_active: template.is_active ? 1 : 0,
        stages: JSON.stringify(template.stages),
      });
      console.log(`✅ Template "${template.name}" created`);
    } else {
      console.log(`✅ Template "${template.name}" already exists`);
    }
  }

  console.log('🎉 Stage types and templates seeding completed!');
}

seedStageTypes().catch(console.error);
