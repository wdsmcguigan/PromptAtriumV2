import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { prompts, users } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

neonConfig.webSocketConstructor = ws;

console.log('Sync Prompts to Production Database');
console.log('====================================\n');

if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('ERROR: PRODUCTION_DATABASE_URL environment variable not set');
  console.log('\nTo use this script:');
  console.log('1. Get your production database URL from your Neon dashboard or Database pane');
  console.log('2. Run the script with:');
  console.log('   PRODUCTION_DATABASE_URL="your-production-url" npx tsx scripts/sync-prompts-to-production.ts');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL (dev database) not set');
  process.exit(1);
}

function generatePromptId(): string {
  return randomBytes(5).toString('hex');
}

async function main() {
  const devPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const devDb = drizzle({ client: devPool });

  const prodPool = new Pool({ connectionString: process.env.PRODUCTION_DATABASE_URL });
  const prodDb = drizzle({ client: prodPool });

  console.log('Connected to development database');
  console.log('Connected to production database\n');

  const devPrompts = await devDb.select().from(prompts);
  console.log(`Found ${devPrompts.length} prompts in development database`);

  const [prodUser] = await prodDb.select().from(users).limit(1);
  if (!prodUser) {
    console.error('No users found in production database. Please log in to the production app first.');
    await devPool.end();
    await prodPool.end();
    process.exit(1);
  }
  console.log(`Using production user: ${prodUser.username || prodUser.email || prodUser.id}\n`);

  const existingProd = await prodDb.select({ content: sql<string>`substring(prompt_content, 1, 200)` }).from(prompts);
  const existingSet = new Set(existingProd.map(p => p.content?.trim().substring(0, 150)));
  console.log(`Existing prompts in production: ${existingProd.length}`);

  const BATCH_SIZE = 50;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const toInsert = devPrompts.filter(p => {
    const key = p.promptContent?.trim().substring(0, 150);
    if (existingSet.has(key)) {
      skipped++;
      return false;
    }
    return true;
  });

  console.log(`New prompts to insert: ${toInsert.length}`);
  console.log(`Skipping ${skipped} (already exist in production)\n`);

  const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const values = batch.map(p => ({
      id: generatePromptId(),
      name: p.name,
      description: p.description,
      category: p.category,
      promptType: p.promptType,
      promptStyle: p.promptStyle,
      categories: p.categories,
      promptTypes: p.promptTypes,
      promptStyles: p.promptStyles,
      tags: p.tags,
      tagsNormalized: p.tagsNormalized,
      isPublic: p.isPublic ?? true,
      isFeatured: p.isFeatured ?? false,
      isHidden: p.isHidden ?? false,
      isNsfw: p.isNsfw ?? false,
      status: p.status || 'published' as const,
      exampleImagesUrl: p.exampleImagesUrl,
      notes: p.notes,
      author: p.author,
      sourceUrl: p.sourceUrl,
      version: p.version ?? 1,
      intendedGenerator: p.intendedGenerator,
      intendedGenerators: p.intendedGenerators,
      recommendedModels: p.recommendedModels,
      technicalParams: p.technicalParams,
      variables: p.variables,
      intendedRecipient: p.intendedRecipient,
      specificService: p.specificService,
      styleKeywords: p.styleKeywords,
      difficultyLevel: p.difficultyLevel,
      useCase: p.useCase,
      additionalMetadata: p.additionalMetadata,
      license: p.license,
      userId: prodUser.id,
      promptContent: p.promptContent,
      negativePrompt: p.negativePrompt,
    }));

    try {
      await prodDb.insert(prompts).values(values);
      inserted += batch.length;
      process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} — ${inserted} inserted`);
    } catch (e) {
      for (const val of values) {
        try {
          await prodDb.insert(prompts).values(val);
          inserted++;
        } catch (innerErr) {
          errors++;
          console.error(`\n  Failed: "${val.name}" — ${(innerErr as Error).message.substring(0, 80)}`);
        }
      }
    }
  }

  console.log(`\n\n====================================`);
  console.log(`Sync Complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped} (already existed)`);
  console.log(`  Errors:   ${errors}`);
  console.log(`====================================\n`);

  const [{ count }] = await prodDb.select({ count: sql<number>`count(*)` }).from(prompts);
  console.log(`Total prompts in production: ${count}`);

  await devPool.end();
  await prodPool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
