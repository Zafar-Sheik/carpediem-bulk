import mysql, { Pool, PoolOptions, ResultSetHeader, RowDataPacket, QueryResult } from 'mysql2/promise';

/** Numeric insert id from mysql2 / TiDB (handles bigint). Returns 0 if missing or invalid. */
export function getInsertIdNumber(header: ResultSetHeader): number {
  const raw = header.insertId as number | bigint | undefined;
  if (raw == null) return 0;
  if (typeof raw === 'bigint') {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

interface ColumnCheck extends RowDataPacket {
  c: number;
}

const isProduction = process.env.NODE_ENV === 'production';

function buildSslConfig(): PoolOptions['ssl'] | undefined {
  if (process.env.TIDB_SSL === 'false' || process.env.MYSQL_SSL === 'false') return undefined;

  const host = (process.env.MYSQL_HOST || '').toLowerCase();
  const isTiDB =
    host.includes('tidbcloud.com') ||
    host.includes('tidb.') ||
    process.env.TIDB_SSL === 'true';

  if (isTiDB) return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (isProduction) return { rejectUnauthorized: true };
  return undefined;
}

const poolConfig: PoolOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '4000', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bulk_notification',
  waitForConnections: true,
  connectionLimit: isProduction ? 5 : 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: buildSslConfig(),
};

let pool: Pool | null = null;
let initialized = false;

async function ensureNotificationColumns(p: Pool): Promise<void> {
  const addIfMissing = async (column: string, ddl: string) => {
    const [rows] = await p.query<ColumnCheck[]>(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = ?`,
      [column]
    );
    if (Number(rows[0]?.c) === 0) {
      await p.execute(ddl);
    }
  };
  await addIfMissing('attachments', 'ALTER TABLE notifications ADD COLUMN attachments LONGTEXT NULL');
  await addIfMissing('delivered_count', 'ALTER TABLE notifications ADD COLUMN delivered_count INT NOT NULL DEFAULT 0');
  await addIfMissing('opened_count', 'ALTER TABLE notifications ADD COLUMN opened_count INT NOT NULL DEFAULT 0');
  await addIfMissing(
    'target_province',
    "ALTER TABLE notifications ADD COLUMN target_province VARCHAR(50) NOT NULL DEFAULT 'All'"
  );
  await addIfMissing(
    'status',
    "ALTER TABLE notifications ADD COLUMN status ENUM('pending','sent','failed','scheduled') NOT NULL DEFAULT 'pending'"
  );
}

async function ensureDeviceColumns(p: Pool): Promise<void> {
  const addIfMissing = async (column: string, ddl: string) => {
    const [rows] = await p.query<ColumnCheck[]>(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = ?`,
      [column]
    );
    if (Number(rows[0]?.c) === 0) {
      await p.execute(ddl);
    }
  };
  await addIfMissing('province', "ALTER TABLE devices ADD COLUMN province VARCHAR(50) DEFAULT ''");
  await addIfMissing('platform', "ALTER TABLE devices ADD COLUMN platform VARCHAR(50) DEFAULT ''");
  await addIfMissing('browser', "ALTER TABLE devices ADD COLUMN browser VARCHAR(100) DEFAULT ''");
  await addIfMissing('user_agent', 'ALTER TABLE devices ADD COLUMN user_agent TEXT');
}

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

async function initializeTables(): Promise<void> {
  if (initialized) return;

  const p = getPool();

  await p.execute(`
    CREATE TABLE IF NOT EXISTS devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fcm_token VARCHAR(512) NOT NULL,
      province VARCHAR(50) DEFAULT '',
      platform VARCHAR(50) DEFAULT '',
      browser VARCHAR(100) DEFAULT '',
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_fcm_token (fcm_token),
      INDEX idx_province (province)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureDeviceColumns(p);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      message VARCHAR(500) NOT NULL,
      image_url LONGTEXT,
      attachments LONGTEXT,
      link VARCHAR(2048) DEFAULT '',
      sent_by_admin VARCHAR(100) NOT NULL,
      target_province VARCHAR(50) DEFAULT 'All',
      status ENUM('pending','sent','failed','scheduled') DEFAULT 'pending',
      sent_count INT DEFAULT 0,
      delivered_count INT DEFAULT 0,
      opened_count INT DEFAULT 0,
      sent_at TIMESTAMP NULL,
      scheduled_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_sent_by_admin (sent_by_admin),
      INDEX idx_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureNotificationColumns(p);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('ADMIN') DEFAULT 'ADMIN',
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  initialized = true;
  console.log('MySQL tables initialized');
}

export async function connectDB(): Promise<Pool> {
  const p = getPool();
  await initializeTables();
  return p;
}

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<T> {
  const p = await connectDB();
  const [rows] = await p.query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<ResultSetHeader> {
  const p = await connectDB();
  const [result] = await p.query<ResultSetHeader>(sql, params);
  return result;
}

export { getPool };
export default connectDB;
