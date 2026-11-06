# Платформа CraftWork — Сервис управления заказами

Предназначен для автоматической публикации ИТ-заказов заказчиками и их адресной рассылки подходящим исполнителям на основе сопоставления технологического стека, роли и грейда фрилансеров. Учебный сервис курсовой работы по дисциплине «Оптимизация клиент-серверных приложений».

## Требования

- Среда выполнения Node.js v22.13.1;
- Системный менеджер пакетов npm v10.x;
- СУБД PostgreSQL v15;
- Среда Docker Desktop для развёртывания контейнеров базы данных.

## Установка и запуск

    git clone https://github.com/taia714dem/CraftWork-AI-Freelance-Platform
    cd CraftWork
    npm install
    docker start craftwork-postgres
    npx prisma migrate dev
    npx prisma db seed
    npm run start:dev

## Переменные окружения

| Переменная     | Назначение                                  | Пример                                                |
|----------------|---------------------------------------------|-------------------------------------------------------|
| DATABASE_URL   | Строка подключения к базе данных PostgreSQL | postgresql://postgres:changeme@localhost:5432/craftwork_db?schema=public |
| PORT           | Сетевой порт запуска сервера Nest.js        | 3000                                                  |

## Проверка работоспособности

Интерфейс клиентской панели открывается в браузере по адресу http://localhost:3000. Идентификация пользователей и проверка прав доступа осуществляются под учётной записью (токеном) `taisia_demidova_client` в заголовке авторизации.

## Тесты

    npm run test

## Нагрузочный тест (k6)
Требования: k6 установлен (k6 version).

Перед запуском база должна быть наполнена рабочим объёмом. Сервис — запущен (npm run start:dev).

Тест — load/test.js. Три сценария (выбор через -e SCENARIO=...):

Сценарий	Что нагружает	-e SCENARIO=
mixed	90% GET /responses, 10% POST /orders	mixed
heavy	100% POST /orders (тяжёлая)	heavy
getOnly	100% GET /responses (сводка)	getOnly
Порог (в тесте): p(95) < 500 мс, доля ошибок < 1%. Частота — -e RATE=... (запросов/с), длительность — 30 с.

Запуск:

cd load

# Смешанный профиль, 1 запрос/с
k6 run test.js -e SCENARIO=mixed -e RATE=1

# Тяжёлая операция (POST /orders), 1 запрос/с
k6 run test.js -e SCENARIO=heavy -e RATE=1

# Только сводка (GET /responses), 1 запрос/с
k6 run test.js -e SCENARIO=getOnly -e RATE=1



## Программный интерфейс

| Метод и путь | Параметры | Ответ | Ошибки |
| :--- | :--- | :--- | :--- |
| POST /orders | **Headers:** Authorization <br>**Body (JSON):** title, specification, role, stack, gradeRequired, totalPriceRub | 201 и JSON-объект созданного заказа из базы данных | 400, 401 | 422
| POST /orders/:id/simulate-responses | **Headers:** Authorization <br>**Param:** id (идентификатор заказа) | 201 и объект подтверждения `{"success": true}` | 401, 500 | 404
| GET /orders/:id/responses | **Headers:** Authorization <br>**Param:** id (идентификатор заказа) | 200 и объект параметров заказа со вложенным массивом откликов исполнителей | 401, 500 | 404

## Команды наполнения
Малое наполнение: npm run seed:small
Рабочее наполение: npm run seed:heavy
