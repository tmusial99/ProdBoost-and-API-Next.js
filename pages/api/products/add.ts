import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import { IProduct } from "../../../types/items";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const data: IProduct = req.body;
        if(!data || !data.name || data.quantity as number < 0){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('products')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        let newProductId;
        try{
            const newestProduct = await db.collection('products').find({companyId: new ObjectId(session.user.companyId)}).sort({productId: -1}).limit(1).toArray();
            const highestProductId: number = newestProduct[0]?.productId;
            newProductId = highestProductId ? highestProductId + 1 : 1;
            await db.collection('products').insertOne({
                ...data,
                productId: newProductId,
                companyId: new ObjectId(session.user.companyId),
                createdBy: session.user.name,
                createdAt: Date.now(),
                usedComponents: [],
                usedPacking: [],
                richTextData: ''
            })  
        }
        catch(error){
            await client.close();
            res.status(500).json('mongodb problem');
            return;
        }
         
        await client.close();
        res.status(200).json(newProductId);
    }
    else{
        res.status(500).json('Route not valid');
    }
}