# CJMBI - Visual Dashboard Builder

CJMBI — визуальный конструктор дашбордов на базе фреймворка Mosaic. Позволяет создавать интерактивные дашборды с помощью drag-and-drop без написания кода.

## 🚀 Возможности

- **Визуальный редактор** — drag-and-drop интерфейс для создания дашбордов
- **Множество виджетов** — Scatter, Bar, Line, Area, Histogram, Heatmap, Table, Metric
- **DuckDB Backend** — мощный аналитический движок для обработки данных
- **DuckDB-WASM** — альтернативный режим работы прямо в браузере
- **Интерактивные связи** — виджеты могут взаимодействовать друг с другом
- **Экспорт/Импорт** — сохранение и загрузка проектов в JSON

## 📋 Требования

- Docker и Docker Compose (для развертывания)
- Node.js 18+ (для локальной разработки)

## 🛠️ Развертывание

### Вариант 1: Docker Compose (рекомендуется)

Полный стек с Mosaic DuckDB Server и CJMBI Frontend в одной сети:

```bash
# Клонировать репозиторий
git clone https://github.com/fade-stipend-wing/mosaic.git
cd mosaic/cjmbi

# Собрать и запустить все сервисы
docker-compose up -d

# Сервисы:
# - CJMBI Frontend: http://localhost:3000
# - Mosaic DuckDB Server: http://localhost:3001
```

### Вариант 2: Docker Compose с отдельными командами

```bash
# Собрать образы
docker-compose build

# Запустить только Mosaic Server
docker-compose up -d mosaic-server

# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes
docker-compose down -v
```

### Вариант 3: Режим разработки с Docker

```bash
# Запустить Mosaic Server + CJMBI в dev режиме с hot reload
docker-compose --profile dev up mosaic-server cjmbi-dev

# Сервисы:
# - CJMBI Dev: http://localhost:5173
# - Mosaic Server: http://localhost:3001
```

### Вариант 4: Локальная разработка (без Docker)

```bash
# Терминал 1: Запустить Mosaic DuckDB Server
cd packages/server/duckdb-server
pip install -e .
duckdb-server

# Терминал 2: Запустить CJMBI Frontend
cd cjmbi
npm install
npm run dev

# Сервисы:
# - CJMBI: http://localhost:5173
# - Mosaic Server: http://localhost:3000
```

### Вариант 5: Production сборка без Docker

```bash
# Установить зависимости
npm install

# Собрать приложение
npm run build

# Файлы для деплоя находятся в папке dist/
# Разместите их на любом статическом хостинге (Nginx, Apache, Vercel, Netlify)
# Не забудьте настроить прокси для API запросов к Mosaic Server
```

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                    (mosaic-network)                         │
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │   CJMBI Frontend    │      │   Mosaic DuckDB Server  │  │
│  │   (Nginx + React)   │─────▶│   (Python + DuckDB)     │  │
│  │                     │      │                         │  │
│  │   Port: 3000        │      │   Port: 3001            │  │
│  │   /api/* → proxy    │      │   HTTP + WebSocket      │  │
│  │   /ws/*  → proxy    │      │                         │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                         │                   │
│                                         ▼                   │
│                               ┌─────────────────────┐      │
│                               │   Volume: data      │      │
│                               │   (mosaic-data)     │      │
│                               └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Конфигурация

### Переменные окружения

#### CJMBI Frontend

```env
# URL Mosaic сервера (для сборки)
VITE_MOSAIC_SERVER_URL=http://localhost:3001

# Порт для dev-сервера
VITE_PORT=5173
```

#### Mosaic Server

```env
# Директория для данных
MOSAIC_DATA_DIR=/data
```

### Docker Compose переменные

Создайте файл `.env` в директории `cjmbi/`:

```env
# Порты
CJMBI_PORT=3000
MOSAIC_SERVER_PORT=3001

# Mosaic Server URL для frontend
VITE_MOSAIC_SERVER_URL=http://mosaic-server:3000
```

### Nginx конфигурация

Конфигурация Nginx (`nginx.conf`) включает:
- Gzip сжатие для статических файлов
- Кэширование статических ресурсов на 1 год
- SPA routing (все запросы перенаправляются на index.html)
- Security headers
- **Прокси для API** (`/api/*` → Mosaic Server)
- **Прокси для WebSocket** (`/ws/*` → Mosaic Server)

## 📁 Структура проекта

```
cjmbi/
├── src/
│   ├── components/       # UI компоненты
│   │   ├── canvas/       # Canvas и рендеринг виджетов
│   │   ├── common/       # Общие компоненты (Icon, Button)
│   │   └── panels/       # Панели интерфейса
│   ├── core/
│   │   ├── mosaic/       # Интеграция с Mosaic/DuckDB
│   │   └── state/        # Zustand store
│   ├── features/
│   │   ├── data-source/  # Управление источниками данных
│   │   └── widget-builder/ # Палитра и настройки виджетов
│   ├── types/            # TypeScript типы
│   ├── App.tsx           # Главный компонент
│   ├── main.tsx          # Точка входа
│   └── index.css         # Глобальные стили
├── docker/
│   └── Dockerfile.mosaic-server  # Dockerfile для Mosaic Server
├── public/               # Статические файлы
├── Dockerfile            # Docker образ для CJMBI
├── docker-compose.yml    # Docker Compose конфигурация
├── nginx.conf            # Nginx конфигурация
├── package.json          # Зависимости
├── vite.config.ts        # Vite конфигурация
├── tailwind.config.js    # Tailwind CSS конфигурация
└── tsconfig.json         # TypeScript конфигурация
```

## 🎯 Использование

### Загрузка данных

1. Нажмите на вкладку **Data** в левой панели
2. Нажмите **Load Sample Data** для загрузки демо-данных
3. Или загрузите свой CSV файл через **Upload CSV**

### Создание виджета

1. Перейдите на вкладку **Widgets** в левой панели
2. Кликните на нужный тип виджета (Scatter, Bar, Table и т.д.)
3. Виджет появится на canvas

### Настройка виджета

1. Кликните на виджет для выбора
2. В правой панели **Properties** настройте:
   - **Table** — выберите источник данных
   - **X Axis / Y Axis** — выберите поля для осей
   - **Color / Size** — дополнительные визуальные параметры

### Сохранение проекта

1. Нажмите **Save** в верхней панели
2. Проект сохранится как JSON файл
3. Для загрузки нажмите **Open** и выберите файл

## 🔗 Технологии

### Frontend (CJMBI)
- **React 18** — UI библиотека
- **TypeScript** — типизация
- **Vite** — сборщик
- **Tailwind CSS** — стилизация
- **Zustand** — управление состоянием
- **@dnd-kit** — drag-and-drop
- **@uwdata/vgplot** — Mosaic/DuckDB интеграция
- **Lucide React** — иконки

### Backend (Mosaic Server)
- **Python 3.11** — runtime
- **DuckDB** — аналитическая база данных
- **Socketify** — HTTP/WebSocket сервер
- **PyArrow** — Apache Arrow для быстрой передачи данных

## 🐳 Docker команды

```bash
# Сборка образов
docker-compose build

# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f cjmbi
docker-compose logs -f mosaic-server

# Перезапуск сервиса
docker-compose restart cjmbi

# Остановка
docker-compose down

# Полная очистка (включая volumes)
docker-compose down -v --rmi all
```

## 📝 Лицензия

MIT License
