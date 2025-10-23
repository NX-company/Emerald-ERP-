# Инструкции для Claude Code

## ОБЯЗАТЕЛЬНО ЧИТАЙ ПЕРЕД КАЖДОЙ ЗАДАЧЕЙ!

### 1. Перед началом работы

**ВСЕГДА**:
1. Читай `ARCHITECTURE.md` - там описана вся структура
2. Проверяй текущее состояние:
   - Какой порт используется (должен быть 9000)
   - Какие процессы запущены
   - Есть ли ошибки в логах

### 2. Правила работы с кодом

#### ✅ ОБЯЗАТЕЛЬНО:

1. **Repository Pattern**
   - Вся логика БД в `repository.ts`
   - Routes только для HTTP обработки

2. **Типы из Shared**
   ```typescript
   import type { Deal, User } from "@shared/schema";
   ```

3. **TanStack Query на фронте**
   ```typescript
   const { data, isLoading } = useQuery<Type[]>({
     queryKey: ['/api/endpoint'],
   });
   ```

4. **Invalidate после мутаций**
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
   }
   ```

5. **Activity Logs для важных изменений**
   ```typescript
   await activityLogsRepository.logActivity({
     entity_type: "deal",
     entity_id: id,
     action_type: "updated",
     user_id: userId,
     description: "Описание на русском",
   });
   ```

#### ❌ НИКОГДА:

1. **НЕ добавляй proxy в vite.config.ts** - один порт для всего!
2. **НЕ используй raw SQL** - только Drizzle ORM
3. **НЕ забывай invalidateQueries** - иначе данные не обновятся
4. **НЕ создавай сложную логику в routes** - только в repository
5. **НЕ используй fetch напрямую** - только `apiRequest()`

### 3. Когда добавляешь новую функцию

**Порядок действий**:

1. ✅ Схема БД (`shared/schema.ts`)
2. ✅ Repository (`server/modules/[name]/repository.ts`)
3. ✅ Routes (`server/modules/[name]/routes.ts`)
4. ✅ Регистрация routes (`server/routes.ts`)
5. ✅ Frontend Query/Mutation
6. ✅ UI компоненты
7. ✅ Activity Logs (если нужно)
8. ✅ Права (если нужно)

**Используй чек-лист**: `DEVELOPMENT_CHECKLIST.md`

### 4. Debugging стратегия

#### Проблема: API не работает
```bash
# 1. Проверь логи сервера
# 2. Проверь curl:
curl http://localhost:9000/api/endpoint

# 3. Проверь схему БД в shared/schema.ts
# 4. Проверь repository
```

#### Проблема: Frontend не обновляется
```typescript
// 1. Проверь invalidateQueries
// 2. Проверь queryKey совпадает
// 3. Добавь: staleTime: 0, refetchOnMount: 'always'
```

#### Проблема: Права не работают
```bash
# Проверь что /api/users/:id возвращает:
curl http://localhost:9000/api/users/[ID]
# Должно быть: can_create_deals, can_edit_deals, etc.
```

### 5. Система прав (УПРОЩЕННАЯ)

**Текущая логика**:
- Admin (`username === 'admin'`) получает ВСЕ права
- Код в: `server/modules/users/routes.ts`
- Проверка на фронте: `currentUser?.can_create_deals`
- Проверка на бэке: middleware `checkPermission()`

**НЕ УСЛОЖНЯЙ!** Если нужно добавить право:
1. Добавь поле в ответ `/api/users/:id` для admin
2. Проверь на фронте через `currentUser?.can_[action]_[entity]`

### 6. Activity Logs (События)

**Когда логировать**:
- ✅ Создание/изменение/удаление сделок
- ✅ Создание/изменение/удаление проектов
- ✅ Изменение этапов
- ✅ Важные действия пользователя

**Как логировать**:
```typescript
await activityLogsRepository.logActivity({
  entity_type: "deal",      // или "project"
  entity_id: dealId,
  action_type: "updated",   // или "created", "deleted"
  user_id: userId,
  field_changed: "stage",   // какое поле (опционально)
  old_value: "old",        // старое значение (опционально)
  new_value: "new",        // новое значение (опционально)
  description: "Изменен этап с 'Новый' на 'Договор'",  // ОБЯЗАТЕЛЬНО на русском!
});

// НЕ ЗАБУДЬ invalidate queries!
queryClient.invalidateQueries({ queryKey: ['/api/activity-logs', entity_type, entity_id] });
```

### 7. Если что-то сломалось

**ПЛАН ДЕЙСТВИЙ**:

1. **Проверь логи сервера** - там будет ошибка
2. **Проверь консоль браузера** - ошибки JS
3. **Проверь Network tab** - что API возвращает
4. **Откат к рабочей версии** - если совсем сломалось
5. **Читай ARCHITECTURE.md** - может проблема в понимании архитектуры

### 8. Производительность

**Оптимизации**:

1. **Параллельные запросы** - используй несколько `useQuery` одновременно
2. **Invalidate только нужное** - не `queryClient.invalidateQueries()` без параметров
3. **Loading states** - показывай `isLoading` пользователю
4. **Error handling** - всегда обрабатывай ошибки

### 9. Коммуникация с пользователем

**Когда спрашивать**:
- ❓ Неясно какая логика нужна
- ❓ Несколько вариантов реализации
- ❓ Нужно принять архитектурное решение

**Когда НЕ спрашивать**:
- ✅ Понятно из контекста
- ✅ Есть пример в коде
- ✅ Описано в документации

### 10. Финальный чек перед ответом пользователю

- [ ] Код работает (проверил сам)
- [ ] Нет TypeScript ошибок
- [ ] Нет ошибок в логах сервера
- [ ] Нет ошибок в консоли браузера
- [ ] Данные обновляются после изменений (invalidateQueries)
- [ ] Activity logs создаются (если применимо)
- [ ] Права проверяются (если применимо)

## Резюме: КАК РАБОТАТЬ БЫСТРО И ЧИСТО

1. **Читай документацию** перед началом
2. **Следуй чек-листу** при добавлении функций
3. **Используй паттерны** из существующего кода
4. **Тестируй сразу** после написания
5. **Не усложняй** - простые решения лучше
6. **Пиши комментарии** для сложной логики
7. **Invalidate queries** после мутаций
8. **Логируй важное** через Activity Logs

## ГЛАВНОЕ ПРАВИЛО

**ЕСЛИ ИСПРАВЛЯЕШЬ БАГ 2+ РАЗА - ПРОБЛЕМА В АРХИТЕКТУРЕ!**
Останови работу, найди корень проблемы, исправь архитектуру.
