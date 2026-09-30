const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'order_tracker',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS catalog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      price DECIMAL(10,2) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Placed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES catalog(id)
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM catalog');
  if (rows[0].c === 0) {
    await pool.query('INSERT INTO catalog (name, description, price) VALUES ?', [[
      ['Chicken Biryani', 'Full plate with raita', 450],
      ['Zinger Burger', 'Crispy chicken, fries on the side', 550],
      ['Beef Pizza (Large)', '12 inch, extra cheese', 1800],
      ['Chicken Karahi (Half)', 'Serves 2 people', 1400],
      ['Mango Shake', 'Fresh, 500ml', 250],
      ['Cold Coffee', 'With ice cream', 320],
    ]]);
  }
  console.log('Database ready');
}

module.exports = { pool, initDb };