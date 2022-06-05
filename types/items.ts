import { ObjectId } from "mongodb";

export interface IMaterial {
    materialId?: number,
    name: string,
    quantity: number | undefined,
    tags: string[],
    netto?: number | undefined,
    brutto?: number | undefined,
    length?: number | undefined,
    width?: number | undefined,
    depth?: number | undefined,
    weight?: number | undefined,
    image_url?: string,
    createdById?: ObjectId | string,
    createdAt?: number
}