import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Tabel Tiket Keluhan
export const tickets = sqliteTable('tickets', {
   id: text('id').primaryKey(),
   nama: text('nama').notNull(),
   email: text('email'),
   gedung: text('gedung').notNull(),
   lantai: text('lantai').notNull(),
   kamar: text('kamar').notNull(),
   kendala: text('kendala').notNull(),
   status: text('status').default('pending').notNull(),
   createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Tabel admin untuk login
export const admins = sqliteTable('admins', {
   id: integer('id').primaryKey({ autoIncrement: true }),
   username: text('username').unique().notNull(),
   password: text('password').notNull(),
   createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});