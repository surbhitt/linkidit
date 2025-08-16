import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { Order, Precedence } from '../models/order'

let db: Database

export const initDB = async () => {
    // first time the server spins up a data folder creation
    // and a db initialization is required
    // also create a new table orders with index and trigger
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
                    linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')) DEFAULT 'primary', 
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                    deletedAT DATETIME, 
                    FOREIGN KEY (linkedId) REFERENCES orders(id));
                CREATE INDEX IF NOT EXISTS idx_phone_number ON orders(phoneNumber);
                CREATE INDEX IF NOT EXISTS idx_email ON orders(email);
                CREATE TRIGGER IF NOT EXISTS update_updatedAt
                    AFTER UPDATE ON orders
                    FOR EACH ROW
                    BEGIN
                        UPDATE orders
                        SET updatedAt = CURRENT_TIMESTAMP
                        WHERE id = OLD.id;
                    END;
    `)
}

const createSelectQuery = (phoneNumber: string, email: string): string => {
    // create select query to check for not null phoneNumber email
    let q: string = "SELECT * FROM orders WHERE"
    if (phoneNumber) {
        q += ` phoneNumber = '${phoneNumber}'`
    }
    if (email) {
        if (phoneNumber) q += " OR"
        q += ` email = '${email}'`
    }
    return q
}

const createInsertQuery = (parentOrderId: number): string => {
    // create an insert query based on
    // if parentOrderId needs to be inserted in LinkedId
    if (parentOrderId == -1) return 'INSERT INTO orders(phoneNumber, email) VALUES (?, ?)'
    else return `INSERT INTO orders(phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ${parentOrderId}, 'secondary')`
}

export const identify = async (phoneNumber: string, email: string) => {
    // ** MAIN LOGIC FUNCION **
    // 1. Search for orders based on phoneNumber and email provided
    // 2. Extract the earliest entry(lowest id), this is the parentOrderId
    // 3. All other entries become secondary
    // 4. Determine if a new record creation is required
    //    (if either phoneNumber or email not found in existing rows)
    // 5. If multiple primary orders exist merge
    //    also change linkedId for children of records being merged
    // 6. Create final response 
    if (!db) {
        throw new Error('Database not initialized');
    }

    let selectQ: string = createSelectQuery(phoneNumber, email);
    let orders: Order[] = await db.all(selectQ)

    let parentOrderId: number = -1
    let cntPrimaryOrder: number = 0
    let conEmails: Set<string> = new Set([]), conPhoneNumbers: Set<string> = new Set([])
    orders.forEach(order => {
        if (parentOrderId == -1) {
            if (order.linkedId) parentOrderId = order.linkedId
            else parentOrderId = order.id
        }
        else {
            if (order.linkedId) parentOrderId = Math.min(parentOrderId, order.linkedId)
            else parentOrderId = Math.min(parentOrderId, order.id)
        }

        if (order.linkPrecedence == Precedence.primary) cntPrimaryOrder++
        conEmails.add(order.email)
        conPhoneNumbers.add(order.phoneNumber)
    })

    // collect secondary ids their and their children's 
    // linkedId will be changed to parentOrderId
    let secondaryOrderIds: number[] = []
    orders.forEach(order => {
        if (order.id != parentOrderId) secondaryOrderIds.push(order.id)
    })

    // new record creation required
    // couldnt find either the phone or email or both
    if ((phoneNumber && !conPhoneNumbers.has(phoneNumber)) || (email && !conEmails.has(email))) {
        const result = await db.run(createInsertQuery(parentOrderId), [phoneNumber, email])
        const newId = result.lastID;
        if (!newId) {
            throw new Error(`Couln't create new record for phoneNumber=${phoneNumber} & email=${email}`);
        }
        
        conPhoneNumbers.add(phoneNumber)
        conEmails.add(email)

        if (parentOrderId != -1) secondaryOrderIds.push(newId)
        else parentOrderId = newId
    }

    if (cntPrimaryOrder > 1) {
        // multiple primary orders 
        // needs merging
        await db.all(
            `UPDATE orders SET linkedId = ${parentOrderId}, linkPrecedence = "secondary" WHERE id IN (${secondaryOrderIds.toString()}) OR linkedId IN (${secondaryOrderIds.toString()})`,
        );
    }

    // create final response
    let rows: Order[] = await db.all(`SELECT id, phoneNumber, email  FROM orders WHERE linkedId = ${parentOrderId}`)
    let secondaryOrderIdsSet: Set<number> = new Set(secondaryOrderIds)
    rows.forEach(order => {
        conEmails.add(order.email)
        conPhoneNumbers.add(order.phoneNumber)
        secondaryOrderIdsSet.add(order.id)
    })

    return {
        primaryContactId: parentOrderId,
        emails: Array.from(conEmails),
        phoneNumbers: Array.from(conPhoneNumbers),
        secondaryContactIds: Array.from(secondaryOrderIdsSet)
    }
}
