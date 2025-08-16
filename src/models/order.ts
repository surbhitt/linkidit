export enum Precedence {
    primary,
    secondary
}

export interface Order {
    id: number,
    phoneNumber: string,
    email: string,
    linkedId: number, 
    linkPrecedence: Precedence,
    createdAt: string,
    updatedAt: string,
    deletedAt: string
}
