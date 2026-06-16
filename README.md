# UX Live Editor

Редактор постов для Telegram-каналов с rich-контентом.

## Возможности

- WYSIWYG-редактор на базе TipTap
- Блочная структура контента (текст, изображения, видео, аудио)
- Вставка медиа из буфера обмена (Ctrl+V)
- Счетчик символов с лимитом 8000
- Мульти-постинг в несколько каналов
- Отложенная публикация
- Черновики с историей изменений
- Автосохранение

## Быстрый старт

### Требования

- Node.js 20+
- PostgreSQL
- Telegram Bot Token (от @BotFather)

### Установка

```bash
git clone https://github.com/mstrzab/ux-live-editor.git
cd ux-live-editor
npm install
```

### Настройка

```bash
cp .env.example .env
# Заполни .env своими данными
```

### Запуск

```bash
npx prisma migrate dev --name init
npm run dev
```

Открой http://localhost:3000

### Деплой на сервер

```bash
chmod +x deploy.sh
./deploy.sh
```

## Telegram Bot

1. Создай бота через @BotFather
2. Скопируй токен в .env
3. Добавь бота администратором канала
4. Узнай ID канала (например, через @userinfobot или API)

## Структура проекта

```
src/
├── app/           # Next.js App Router pages и API
├── components/    # React компоненты
├── lib/           # Утилиты, Prisma, Auth
└── generated/     # Сгенерированные типы Prisma
prisma/
└── schema.prisma  # Схема базы данных
```
