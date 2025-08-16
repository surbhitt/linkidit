export enum Precedence {
    primary = "primary",
    secondary = "secondary"
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
