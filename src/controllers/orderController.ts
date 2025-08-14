import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

export const initDB = async () => {
    const db = await open({
        'filename': path.resolve(__dirname, '../../data/orders.db'),
        'driver': sqlite3.Database
    })
    await db.exec(`
                  CREATE TABLE IF NOT EXISTS orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT, 
                        phoneNumber TEXT, 
                        email TEXT, 
                        linkedId INTEGER, 
                        linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')), 
                        createdAt DATETIME NOT NULL, 
                        updatedAt DATETIME NOT NULL, 
                        deletedAT DATETIME, 
                        FOREIGN KEY (linkedId) REFERENCES orders(id));
    `)
}
