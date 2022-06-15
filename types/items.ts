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
    createdBy?: string,
    createdAt?: number
}

export interface IComponent {
    componentId?: number,
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
    createdBy?: string,
    createdAt?: number,
    usedMaterials?: string[],
    richTextData?: string
}

export interface IProduct {
    productId?: number,
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
    createdBy?:  string,
    createdAt?: number,
    usedComponents?: string[],
    usedPacking?: string[],
    richTextData?: string
}

export interface IPacking {
    packingId?: number,
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
    createdBy?: string,
    createdAt?: number
}