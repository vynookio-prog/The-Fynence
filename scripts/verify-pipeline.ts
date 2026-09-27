import { EditionPipelineService } from '../src/telegram/service/editionPipelineService';
import { WeatherService } from '../src/weather/service/weatherService';
import { MarketService } from '../src/market/service/marketService';
import { EditionComposer } from '../src/composer/editionComposer';
import { NewspaperRenderer } from '../src/renderer/service/newspaperRenderer';
import { PdfRenderer } from '../src/pdf/service/pdfRenderer';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function runVerification() {
  console.log('====================================================');
  console.log('THE FYNENCE — SYSTEM PIPELINE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 8;

  // 1. Generate Daily Edition
  console.log('Test 1: Generate Daily Edition...');
  const pipeline = new EditionPipelineService();
  const dailyRes = await pipeline.generateEdition({
    requestId: 'test-daily-001',
    source: 'telegram',
    chatId: 10001,
    telegramUserId: 10001,
    editionType: 'daily',
    sections: ['daily_news', 'world', 'national', 'business', 'finance', 'economy', 'markets', 'weather'],
    format: 'both',
    createdAt: new Date().toISOString(),
  });

  if (dailyRes.success && dailyRes.editionType === 'daily') {
    console.log(`  ✅ Daily Edition generated successfully (ID: ${dailyRes.editionId}, Duration: ${dailyRes.durationMs}ms)`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed to generate Daily Edition: ${dailyRes.error}`);
  }

  // 2. Generate Finance + Economy Edition
  console.log('\nTest 2: Generate Finance + Economy Edition...');
  const financeRes = await pipeline.generateEdition({
    requestId: 'test-finance-001',
    source: 'telegram',
    chatId: 10001,
    telegramUserId: 10001,
    editionType: 'finance_economy',
    sections: ['top_story', 'finance', 'economy', 'markets', 'economic_calendar'],
    format: 'both',
    createdAt: new Date().toISOString(),
  });

  if (financeRes.success && financeRes.editionType === 'finance_economy') {
    console.log(`  ✅ Finance + Economy Edition generated successfully (Title: ${financeRes.title}, Subtitle: ${financeRes.subtitle})`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed to generate Finance + Economy Edition: ${financeRes.error}`);
  }

  // 3. Generate Market Edition
  console.log('\nTest 3: Generate Market Edition...');
  const marketRes = await pipeline.generateEdition({
    requestId: 'test-market-001',
    source: 'telegram',
    chatId: 10001,
    telegramUserId: 10001,
    editionType: 'market',
    sections: ['markets', 'forex', 'crypto'],
    format: 'both',
    createdAt: new Date().toISOString(),
  });

  if (marketRes.success && marketRes.editionType === 'market') {
    console.log(`  ✅ Market Edition generated successfully (Subtitle: ${marketRes.subtitle})`);
    passedTests++;
  } else {
    console.error(`  ❌ Failed to generate Market Edition: ${marketRes.error}`);
  }

  // 4. Generate Weather Magelang
  console.log('\nTest 4: Generate Weather Magelang...');
  const weatherService = new WeatherService();
  try {
    const weather = await weatherService.getCurrentWeather('magelang');
    if (weather && weather.temperature !== undefined && weather.condition) {
      console.log(`  ✅ Magelang Weather retrieved: ${weather.temperature}°C, ${weather.condition}, Humidity: ${weather.humidity}%, Source: ${weather.source.name}`);
      passedTests++;
    } else {
      console.error('  ❌ Weather data is missing required attributes');
    }
  } catch (err: any) {
    console.error(`  ❌ Failed to fetch Magelang weather: ${err.message}`);
  }

  // 5. Generate PNG
  console.log('\nTest 5: Generate PNG...');
  if (dailyRes.imageBuffer && dailyRes.imageBuffer.length > 1000 && dailyRes.imageMimeType === 'image/png') {
    // Check PNG signature: 0x89 0x50 0x4E 0x47
    const isPng =
      dailyRes.imageBuffer[0] === 0x89 &&
      dailyRes.imageBuffer[1] === 0x50 &&
      dailyRes.imageBuffer[2] === 0x4e &&
      dailyRes.imageBuffer[3] === 0x47;

    if (isPng) {
      console.log(`  ✅ PNG generated successfully (${dailyRes.imageBuffer.length} bytes, Magic Header Verified)`);
      passedTests++;
    } else {
      console.error('  ❌ Image buffer does not contain valid PNG magic header');
    }
  } else {
    console.error('  ❌ PNG image buffer was not produced in pipeline');
  }

  // 6. Generate PDF
  console.log('\nTest 6: Generate PDF...');
  if (dailyRes.pdfBuffer && dailyRes.pdfBuffer.length > 1000) {
    // Check PDF signature: %PDF-
    const header = dailyRes.pdfBuffer.subarray(0, 5).toString('utf-8');
    if (header.startsWith('%PDF-')) {
      console.log(`  ✅ PDF generated successfully (${dailyRes.pdfBuffer.length} bytes, Filename: ${dailyRes.pdfFileName})`);
      passedTests++;
    } else {
      console.error(`  ❌ PDF buffer missing %PDF- header, got: ${header}`);
    }
  } else {
    console.error('  ❌ PDF buffer was not produced in pipeline');
  }

  // 7. Pastikan tidak ada API error
  console.log('\nTest 7: Pastikan tidak ada API error (Graceful Resilience)...');
  try {
    // Test with simulated market and weather outages
    const resilientPipeline = new EditionPipelineService({
      weatherService: new WeatherService({
        primaryProvider: {
          providerName: 'failing_weather',
          attribution: { name: 'Fail', url: '' },
          getCurrentWeather: async () => { throw new Error('Simulated upstream weather outage'); },
          getForecast: async () => [],
        },
      }),
      marketService: new MarketService({
        marketProvider: {
          name: 'failing_market',
          getQuote: async () => ({ success: false, provider: 'failing', error: 'Simulated 503' }),
          getQuotes: async () => ({ success: false, provider: 'failing', error: 'Simulated 503' }),
        },
      }),
    });

    const fallbackRes = await resilientPipeline.generateEdition({
      requestId: 'test-resilience-001',
      source: 'telegram',
      chatId: 10001,
      telegramUserId: 10001,
      editionType: 'daily',
      sections: ['daily_news', 'markets', 'weather'],
      format: 'both',
      createdAt: new Date().toISOString(),
    });

    if (fallbackRes.success) {
      console.log('  ✅ Pipeline handled provider outages gracefully without unhandled crashes or API error leakage');
      passedTests++;
    } else {
      console.error(`  ❌ Pipeline failed under outage conditions: ${fallbackRes.error}`);
    }
  } catch (err: any) {
    console.error(`  ❌ Unexpected unhandled exception: ${err.message}`);
  }

  // 8. Pastikan secrets tidak masuk GitHub
  console.log('\nTest 8: Pastikan secrets tidak masuk GitHub...');
  try {
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    const ignoresEnv = gitignoreContent.includes('.env*');

    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    const envExampleContent = await fs.readFile(envExamplePath, 'utf-8');
    const lines = envExampleContent.split('\n');
    const sensitiveKeys = ['GEMINI_API_KEY', 'TWELVE_DATA_API_KEY', 'NEWS_API_KEY', 'WEATHER_API_KEY', 'TELEGRAM_BOT_TOKEN', 'CRON_SECRET'];
    let exampleHasNoRealSecrets = true;
    for (const line of lines) {
      for (const key of sensitiveKeys) {
        if (line.startsWith(`${key}=`)) {
          const val = line.split('=')[1].trim();
          if (!val.startsWith('your_') && val !== '') {
            exampleHasNoRealSecrets = false;
          }
        }
      }
    }

    // Run git status in repo to check if any untracked or staged secrets exist
    const repoDir = existsSync(path.resolve(process.cwd(), '.git')) ? process.cwd() : '/home/ubuntu/project/Fynence-Project';
    const gitStatus = execSync(`git -C "${repoDir}" status --porcelain`, { encoding: 'utf-8' });
    const noTrackedEnv = !gitStatus.includes('.env\n') && !gitStatus.includes(' .env');

    if (ignoresEnv && exampleHasNoRealSecrets && noTrackedEnv) {
      console.log('  ✅ Security verified: .gitignore protects .env*, .env.example contains only placeholders, git working tree clean of credentials');
      passedTests++;
    } else {
      console.error('  ❌ Potential secret exposure detected:', { ignoresEnv, exampleHasNoRealSecrets, noTrackedEnv });
    }
  } catch (err: any) {
    console.error(`  ❌ Secret audit error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
