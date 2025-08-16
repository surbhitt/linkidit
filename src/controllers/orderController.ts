import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { Order, Precedence } from '../models/order'

let db: Database

export const initDB = async () => {
    db = await open({
        'filename': path.resolve(__dirname, '../../data/orders.db'),
        'driver': sqlite3.Database
    })
    // TODO: index phoneNumber, email
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
    `)
}

const createSelectQuery = (phoneNumber: string, email: string): string => {
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
    if (parentOrderId == -1) return 'INSERT INTO orders(phoneNumber, email) VALUES (?, ?)'
    else return `INSERT INTO orders(phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ${parentOrderId}, 'secondary')`
}

export const identify = async (phoneNumber: string, email: string) => {
    // TODO: make the error elegant
    if (!db) {
        throw new Error('Database not initialized');
    }
    if (!phoneNumber && !email) {
        throw new Error('Require either phoneNumber or Email, both can not be null');
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
    let secondaryOrderIds: number[] = []
    orders.forEach(order => {
        if (order.id != parentOrderId) secondaryOrderIds.push(order.id)
    })

    if ((phoneNumber && !conPhoneNumbers.has(phoneNumber)) || (email && !conEmails.has(email))) {
        // couldnt find either the phone or email or both
        // create a new record
        const result = await db.run(createInsertQuery(parentOrderId), [phoneNumber, email])
        const newId = result.lastID;
        if (!newId) {
            // TODO: throw error insert failed
            throw new Error('Database not initialized');
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

    // get all the orders
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
