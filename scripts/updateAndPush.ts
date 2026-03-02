// scripts/updateAndPush.ts

import { execSync } from 'child_process';

function exec(command: string): boolean {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`❌ Ошибка: ${(error as Error).message}`);
        return false;
    }
}

console.log('🔄 Обновляю цены из Google Sheets...');
if (!exec('npm run update-prices')) process.exit(1);

console.log('📝 Проверяю изменения...');
const hasChanges = execSync('git status --porcelain').toString().trim();

if (hasChanges) {
    console.log('✅ Найдены изменения, коммичу...');
    exec('git add .');
    exec('git commit -m "chore: auto-update prices from Google Sheets"');

    console.log('🚀 Пушу в репозиторий...');
    if (!exec('git push')) {
        console.error('❌ Не удалось запушить изменения');
        process.exit(1);
    }

    console.log('✅ Изменения успешно запушены!');
} else {
    console.log('ℹ️  Нет изменений в ценах');
}