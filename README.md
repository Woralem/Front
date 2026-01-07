# README.md для заказчика

# 🐜 CRM Дезинсекция

CRM-система для управления заказами службы дезинсекции.

![Dashboard](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![API](https://img.shields.io/badge/Backend-Express.js-green)
![Database](https://img.shields.io/badge/Database-SQLite-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## 📋 Возможности

- ✅ Календарь заказов с почасовой сеткой
- ✅ Создание первичных и повторных заявок
- ✅ Завершение заказов с расчётом дохода мастера
- ✅ Автоматическое создание повторных заявок
- ✅ Отмена заказов с указанием причины
- ✅ Поиск по телефону, адресу, дате
- ✅ Статистика с план/факт анализом
- ✅ Учёт расходов на рекламу
- ✅ Расчёт чистой прибыли

---

## 🚀 Быстрый старт в GitHub Codespaces

### Шаг 1: Создать Codespace

1. Откройте репозиторий на GitHub
2. Нажмите зелёную кнопку **"Code"**
3. Выберите вкладку **"Codespaces"**
4. Нажмите **"Create codespace on main"**

### Шаг 2: Запустить проект

После загрузки Codespace откройте терминал и выполните:

```bash
# Создать папку для базы данных
mkdir -p backend/data

# Запустить проект через Docker
docker-compose up -d --build
```

### Шаг 3: Открыть приложение

После запуска появятся уведомления о портах. Нажмите:
- **"Open in Browser"** для порта **3000** (Frontend)

Или найдите вкладку **"PORTS"** внизу и кликните на ссылку порта 3000.

### Готово! 🎉

---

## 📖 Подробная инструкция

### Структура проекта

```
crm-pest-control/
├── backend/                 # Backend API (Express.js)
│   ├── data/               # 📁 База данных (SQLite)
│   │   └── dev.db          # Файл БД
│   ├── prisma/
│   │   └── schema.prisma   # Схема БД
│   └── src/
│       ├── index.ts        # Точка входа
│       └── routes/         # API роуты
├── src/                     # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx        # Главная (Дашборд)
│   │   └── statistics/     # Страница статистики
│   ├── components/         # React компоненты
│   └── store/              # Zustand store
├── docker-compose.yml       # Docker конфигурация
├── Dockerfile.frontend      # Docker образ frontend
└── README.md
```

### Команды Docker

```bash
# ═══════════════════════════════════════════════════════════════
#                         ЗАПУСК
# ═══════════════════════════════════════════════════════════════

# Первый запуск (сборка + запуск)
mkdir -p backend/data
docker-compose up -d --build

# Обычный запуск (если уже собрано)
docker-compose up -d

# Остановить
docker-compose down

# ═══════════════════════════════════════════════════════════════
#                          ЛОГИ
# ═══════════════════════════════════════════════════════════════

# Все логи
docker-compose logs

# Логи в реальном времени
docker-compose logs -f

# Логи только backend
docker-compose logs -f backend

# Логи только frontend
docker-compose logs -f frontend

# ═══════════════════════════════════════════════════════════════
#                       ПЕРЕЗАПУСК
# ═══════════════════════════════════════════════════════════════

# Перезапустить всё
docker-compose restart

# Пересобрать и перезапустить
docker-compose up -d --build

# Полный сброс (удалит контейнеры, но НЕ данные)
docker-compose down
docker-compose up -d --build

# ═══════════════════════════════════════════════════════════════
#                         СТАТУС
# ═══════════════════════════════════════════════════════════════

# Проверить статус контейнеров
docker-compose ps

# Проверить что backend работает
curl http://localhost:5000/health
```

### Работа с базой данных

```bash
# Зайти в контейнер backend
docker-compose exec backend sh

# Открыть Prisma Studio (визуальный редактор БД)
docker-compose exec backend npx prisma studio
# Затем откройте порт 5555 в браузере

# Посмотреть данные через SQLite
docker-compose exec backend sh -c 'sqlite3 /app/data/dev.db ".tables"'
docker-compose exec backend sh -c 'sqlite3 /app/data/dev.db "SELECT * FROM \"Order\";"'

# Сбросить базу данных (удалить все данные)
rm -rf backend/data/dev.db
docker-compose restart backend
```

---

## 🖥️ Интерфейс

### Создание заявки

1. Нажмите **"+ Создать заявку"** или кликните на пустую ячейку
2. Заполните форму:
   - Тип (первичный/повторный)
   - Имя клиента
   - Вредитель
   - Объект и объём
   - Адрес
   - Дата и время
   - Телефоны
   - Менеджер
3. Нажмите **"Создать заказ"**

### Завершение заказа

1. Кликните на заказ в календаре
2. Выберите статус **"Выполнен"**
3. Укажите:
   - Итоговую сумму
   - Процент мастера
   - Имя мастера
   - Дату повтора (опционально)
4. Нажмите **"Сохранить"**

### Статистика

1. Нажмите **"📊 Статистика"**
2. Выберите месяц стрелками ◀ ▶
3. Введите расходы на рекламу в колонке **"Расход РК"**
4. Данные сохраняются автоматически при уходе с поля

---

## 🔧 Решение проблем

### Порты не открываются в Codespaces

1. Откройте вкладку **"PORTS"** внизу
2. Найдите порт 3000 (frontend) и 5000 (backend)
3. Нажмите правой кнопкой → **"Port Visibility"** → **"Public"**

### Ошибка подключения к API

```bash
# Проверить логи backend
docker-compose logs backend

# Перезапустить backend
docker-compose restart backend
```

### База данных пустая

```bash
# Проверить что файл БД существует
ls -la backend/data/

# Если пустая - перезапустить backend
docker-compose restart backend

# Проверить логи
docker-compose logs backend | grep -i database
```

### Сбросить всё и начать заново

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить базу данных
rm -rf backend/data/

# Удалить Docker образы (опционально)
docker system prune -f

# Запустить заново
mkdir -p backend/data
docker-compose up -d --build
```

---

## 📱 Порты

| Порт | Сервис | Описание |
|------|--------|----------|
| 3000 | Frontend | Web-интерфейс (Next.js) |
| 5000 | Backend | API сервер (Express.js) |
| 5555 | Prisma Studio | Визуальный редактор БД |

---

## 📝 Технологии

**Frontend:**
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Zustand (state management)

**Backend:**
- Express.js
- TypeScript
- Prisma ORM
- SQLite

**Infrastructure:**
- Docker & Docker Compose
- GitHub Codespaces

---
