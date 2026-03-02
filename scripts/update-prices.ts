import { config } from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== КОНФИГУРАЦИЯ =====
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || 'YOUR_SHEET_ID';
const CREDENTIALS_PATH = path.resolve(__dirname, '../google-credentials.json');

// Маппинг: имя диапазона → ID в constants.ts
const FOOD_RANGE_MAPPING: Record<string, string> = {
    'ГречкаM_цена_в_наборе': 'buckwheat',
    'РисM_цена_в_наборе': 'rice',
    'ФасольM_цена_в_наборе': 'beans',
    'ГорохM_цена_в_наборе': 'peas',
    'ПшеноM_цена_в_наборе': 'millet',
    'СахарM_цена_в_наборе': 'sugar',
    'РожкиM_цена_в_наборе': 'pasta_standard',
    'ЧечевицаM_цена_в_наборе': 'lentils',
    'НутM_цена_в_наборе': 'chickpeas',
    'ОвсянкаM_цена_в_наборе': 'oatmeal',
    'ПтитимMS_цена_в_наборе': 'ptitim',
    'КофеСублS_цена_в_наборе': 'coffee',
    'ПерецS_цена_в_наборе': 'pepper',
    'Соль05_цена_в_наборе': 'salt',
};

const CONTAINER_RANGE_MAPPING: Record<string, string> = {
    'Контейнер_Ирис': 'household',
    'ЯщикДеревянный': 'crate',
    'Коробка_на_4_пакета': 'box',
    'Контейнер70_Pro_Серый': 'expedition',
};

// ===== ПОДКЛЮЧЕНИЕ К GOOGLE SHEETS =====
async function getGoogleSheetsClient() {
    let credentials;

    if (fs.existsSync(CREDENTIALS_PATH)) {
        credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    } else if (process.env.GOOGLE_PRIVATE_KEY) {
        credentials = {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    } else {
        throw new Error('Google credentials not found!');
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
}

// ===== ПОЛУЧЕНИЕ НАЦЕНКИ ЭКВАЙРИНГА =====
async function getAcquiringMarkup(sheets: any): Promise<number> {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Наценка_Эквайринг',
        });

        const value = response.data.values?.[0]?.[0];
        if (value !== undefined && value !== null && value !== '') {
            const markup = parseFloat(String(value).replace(/[^\d.]/g, ''));
            if (!isNaN(markup)) {
                console.log(`📊 Наценка эквайринга: ${markup}`);
                return markup;
            }
        }
        console.warn('⚠ Наценка_Эквайринг не найдена, используем 1.0');
        return 1.0;
    } catch (error) {
        console.warn('⚠ Ошибка чтения Наценка_Эквайринг, используем 1.0');
        return 1.0;
    }
}

// ===== ЧТЕНИЕ ЦЕН ИЗ ИМЕНОВАННЫХ ДИАПАЗОНОВ =====
async function fetchPricesFromNamedRanges(
    sheets: any,
    rangeMapping: Record<string, string>,
    acquiringMarkup: number
): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const rangeNames = Object.keys(rangeMapping);

    console.log(`📥 Загружаем ${rangeNames.length} цен...`);

    // Читаем все диапазоны одним запросом (batch)
    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges: rangeNames,
    });

    response.data.valueRanges?.forEach((range: any, index: number) => {
        const rangeName = rangeNames[index];
        const productId = rangeMapping[rangeName];
        const value = range.values?.[0]?.[0];

        if (value !== undefined && value !== null && value !== '') {
            let price = parseFloat(
                String(value)
                    .replace(/\s/g, '')  // Убираем все пробелы
                    .replace(',', '.')   // Запятую заменяем на точку
            );
             if (!isNaN(price)) {
                // 1. Делим на 100 (копейки → рубли)
                price = price / 100;

                // 2. Умножаем на наценку эквайринга
                price = price * acquiringMarkup;

                // 3. Округляем вверх до десятков рублей
                price = Math.ceil(price / 10) * 10;
                 console.log( "value", value, "price", price)

                prices[productId] = price;
                console.log(`  ✓ ${rangeName} (${productId}): ${price} ₽`);
            } else {
                console.warn(`  ⚠ ${rangeName}: некорректное значение "${value}"`);
            }
        } else {
            console.warn(`  ⚠ ${rangeName}: пустое значение`);
        }
    });

    return prices;
}

// ===== ОБНОВЛЕНИЕ constants.ts =====
async function updateConstantsFile(
    foodPrices: Record<string, number>,
    containerPrices: Record<string, number>
) {
    const constantsPath = path.resolve(__dirname, '../src/constants.ts');
    let content = fs.readFileSync(constantsPath, 'utf-8');

    console.log('\n📝 Обновляем constants.ts...');

    let updatedCount = 0;

    // Обновляем цены продуктов
    Object.entries(foodPrices).forEach(([id, price]) => {
        const regex = new RegExp(
            `(\\{[^}]*id:\\s*['"]${id}['"][^}]*price:\\s*)\\d+(\\.\\d+)?`,
            'g'
        );
        const newContent = content.replace(regex, `$1${price}`);
        if (newContent !== content) {
            console.log(`  ✓ Обновлена цена ${id}: ${price} ₽`);
            updatedCount++;
            content = newContent;
        }
    });

    // Обновляем цены контейнеров
    Object.entries(containerPrices).forEach(([id, price]) => {
        const regex = new RegExp(
            `(\\{[^}]*id:\\s*['"]${id}['"][^}]*price:\\s*)\\d+(\\.\\d+)?`,
            'g'
        );
        const newContent = content.replace(regex, `$1${price}`);
        if (newContent !== content) {
            console.log(`  ✓ Обновлена цена контейнера ${id}: ${price} ₽`);
            updatedCount++;
            content = newContent;
        }
    });

    // Добавляем комментарий о последнем обновлении
    const timestamp = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow'
    });

    if (content.includes('Last price update:')) {
        content = content.replace(
            /\/\/ Last price update:.*/,
            `// Last price update: ${timestamp}`
        );
    } else {
        content = `// Last price update: ${timestamp}\n${content}`;
    }

    fs.writeFileSync(constantsPath, content, 'utf-8');
    console.log(`\n✅ Файл обновлён! Изменено цен: ${updatedCount}`);
}

// ===== MAIN =====
async function main() {
    try {
        const sheets = await getGoogleSheetsClient();

        console.log('🔄 Начинаем обновление цен...\n');

        // Получаем наценку эквайринга
        const acquiringMarkup = await getAcquiringMarkup(sheets);

        const [foodPrices, containerPrices] = await Promise.all([
            fetchPricesFromNamedRanges(sheets, FOOD_RANGE_MAPPING, acquiringMarkup),
            fetchPricesFromNamedRanges(sheets, CONTAINER_RANGE_MAPPING, acquiringMarkup),
        ]);

        console.log(`\n✅ Получено цен продуктов: ${Object.keys(foodPrices).length}`);
        console.log(`✅ Получено цен контейнеров: ${Object.keys(containerPrices).length}`);

        await updateConstantsFile(foodPrices, containerPrices);

        console.log('\n🎉 Обновление завершено успешно!');
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

main();