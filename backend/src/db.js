import mysql from 'mysql2/promise';
export const pool=mysql.createPool({host:process.env.MYSQL_HOST||'localhost',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER||'parking',password:process.env.MYSQL_PASSWORD||'parking',database:process.env.MYSQL_DATABASE||'smart_parking',waitForConnections:true,connectionLimit:10});
export async function checkDatabase(){try{await pool.query('SELECT 1');return true}catch{return false}}
