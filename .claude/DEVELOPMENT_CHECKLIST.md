# Чек-лист разработки новой функции

## Перед началом работы

- [ ] Прочитай `ARCHITECTURE.md` - понимание структуры проекта
- [ ] Проверь что сервер запущен на порту 9000: `npm run dev`
- [ ] Проверь текущую схему БД в `shared/schema.ts`
- [ ] Определи какие модули будут затронуты

## Добавление новой функции (пошагово)

### 1. Backend (API)

#### 1.1 Схема БД (если нужна новая таблица)
```typescript
// shared/schema.ts
export const myTable = sqliteTable('my_table', {
  id: text('id').$defaultFn(() => genId()).primaryKey(),
  // ... поля
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertMyTableSchema = createInsertSchema(myTable).omit({ id: true, created_at: true });
export type InsertMyTable = z.infer<typeof insertMyTableSchema>;
export type MyTable = typeof myTable.$inferSelect;
```

#### 1.2 Repository (бизнес-логика)
```typescript
// server/modules/[name]/repository.ts
export class MyRepository {
  async getAll() {
    return await db.select().from(myTable);
  }

  async create(data: InsertMyTable) {
    const result = await db.insert(myTable).values(data).returning();
    return result[0];
  }
}

export const myRepository = new MyRepository();
```

#### 1.3 Routes (HTTP endpoints)
```typescript
// server/modules/[name]/routes.ts
import { Router } from "express";
import { myRepository } from "./repository";
import { insertMyTableSchema } from "@shared/schema";

export const router = Router();

router.get("/api/my-items", async (req, res) => {
  try {
    const items = await myRepository.getAll();
    res.json(items);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.post("/api/my-items", async (req, res) => {
  try {
    const validatedData = insertMyTableSchema.parse(req.body);
    const item = await myRepository.create(validatedData);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: "Failed to create item" });
  }
});
```

#### 1.4 Регистрация routes
```typescript
// server/routes.ts
import { router as myRouter } from "./modules/[name]/routes";
// ...
app.use(myRouter);
```

### 2. Frontend (UI)

#### 2.1 Query для получения данных
```typescript
// В компоненте
const { data: items = [], isLoading } = useQuery<MyTable[]>({
  queryKey: ['/api/my-items'],
});
```

#### 2.2 Mutation для создания/изменения
```typescript
const createMutation = useMutation({
  mutationFn: async (data: InsertMyTable) => {
    return await apiRequest('POST', '/api/my-items', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/my-items'] });
    toast({ title: "Успешно создано" });
  },
  onError: () => {
    toast({ title: "Ошибка", variant: "destructive" });
  },
});
```

#### 2.3 UI компонент
```typescript
// Используй Shadcn/ui компоненты
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// ...
```

### 3. Activity Logs (если нужно логирование)

```typescript
// В routes после изменения данных
await activityLogsRepository.logActivity({
  entity_type: "deal", // или "project"
  entity_id: dealId,
  action_type: "updated",
  user_id: req.headers["x-user-id"] as string,
  field_changed: "stage",
  old_value: oldValue,
  new_value: newValue,
  description: `Изменен этап с "${oldValue}" на "${newValue}"`,
});
```

### 4. Проверка перед коммитом

- [ ] Сервер запускается без ошибок
- [ ] API endpoints возвращают правильные данные (проверь в браузере DevTools)
- [ ] Frontend корректно отображает данные
- [ ] Нет ошибок в консоли браузера
- [ ] Нет TypeScript ошибок
- [ ] Activity logs создаются (если применимо)
- [ ] Query invalidation работает (данные обновляются после мутаций)

## Частые ошибки (ИЗБЕГАЙ!)

### ❌ НЕ ДЕЛАЙ ТАК:

1. **Не добавляй proxy в vite.config.ts** - всё работает на одном порту
2. **Не используй raw SQL** - только Drizzle ORM
3. **Не забывай invalidateQueries** после мутаций
4. **Не используй прямой fetch** - только `apiRequest()`
5. **Не забывай добавлять права** для новых функций
6. **Не делай сложную логику в routes** - выноси в repository
7. **Не забывай обработку ошибок** - всегда `try/catch`
8. **Не забывай типы** - импортируй из `@shared/schema`

### ✅ ДЕЛАЙ ТАК:

1. **Используй Repository pattern** - логика в repository, routes только HTTP
2. **Всегда валидируй данные** с Zod schemas
3. **Invalidate queries** после каждой мутации
4. **Используй TanStack Query** для всех API запросов
5. **Логируй важные изменения** через Activity Logs
6. **Добавляй права** для новых endpoint'ов
7. **Пиши описательные commit messages** на русском
8. **Тестируй в браузере** перед коммитом

## Debugging

### Backend не отвечает:
```bash
# Проверь что сервер запущен
curl http://localhost:9000/api/users

# Проверь логи сервера в терминале
```

### Frontend не обновляется:
1. Hard refresh: `Ctrl + Shift + R`
2. Очисти кеш React Query: `queryClient.invalidateQueries()`
3. Проверь Network tab в DevTools

### Права не работают:
```bash
# Проверь что API возвращает права
curl http://localhost:9000/api/users/[USER_ID]

# Должен вернуть: can_create_deals, can_edit_deals, etc.
```

## Полезные команды

```bash
# Запуск dev сервера
npm run dev

# Проверка TypeScript
npm run check

# Push схемы в БД
npm run db:push

# Очистка node_modules (если что-то сломалось)
rm -rf node_modules package-lock.json
npm install
```

## Структура модуля (шаблон)

```
server/modules/[name]/
├── repository.ts    # Бизнес-логика + работа с БД
├── routes.ts        # HTTP endpoints
└── types.ts         # Дополнительные типы (опционально)
```

## Приоритеты разработки

1. **Сначала backend** - API должен работать
2. **Потом frontend** - UI использует готовый API
3. **Потом полировка** - улучшения UX, валидация, etc.

## Когда просить помощь

- Если не понимаешь архитектуру - читай `ARCHITECTURE.md`
- Если непонятно как работает код - ищи примеры в существующих модулях
- Если баг повторяется 2+ раза - проблема в архитектуре, нужно рефакторить
