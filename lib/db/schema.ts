import {
  pgTable,
  serial,
  varchar,
  text,
  jsonb,
  timestamp,
  integer,
  real,
} from 'drizzle-orm/pg-core';

// Mirror table: User NFTs
export const userNFTs = pgTable('user_nfts', {
  id: serial('id').primaryKey(),
  userAddress: varchar('user_address', { length: 64 }).notNull(),
  collectionId: text('collection_id').notNull(),
  itemId: text('item_id').notNull(),
  owner: text('owner').notNull(),
  itemDetails: jsonb('item_details').notNull(),
  itemMetadata: jsonb('item_metadata').notNull(),
  collectionMetadata: jsonb('collection_metadata').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// History table: Image generation
export const imageGenerationHistory = pgTable('image_generation_history', {
  id: serial('id').primaryKey(),
  userAddress: varchar('user_address', { length: 64 }).notNull(),
  prompt: text('prompt').notNull(),
  negPrompt: text('neg_prompt'),
  model: varchar('model', { length: 100 }).notNull(),
  numIterations: integer('num_iterations').notNull(),
  guidanceScale: real('guidance_scale').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  seed: integer('seed'),
  generatedUrl: text('generated_url').notNull(),
  response: jsonb('response'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
