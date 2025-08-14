import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

let db: Database

export const initDB = async () => {
    db = await open({
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

export const identify = async (phoneNumber: string, email: string) => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    return db.all('SELECT * FROM orders')
}
