import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import { IProduct } from "../../../types/items";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {data, productId}: {data: IProduct, productId: string} = req.body;
        if(!data || !data.name || data.quantity as number < 0 || !productId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('products')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const objectToUpdate = {
            netto: '',
            brutto: '',
            length: '',
            width: '',
            depth: '',
            weight: '',
            ...data
        }
        const asArray = Object.entries(objectToUpdate);
        const onlyTrue = asArray.filter(([key, value]) => value || value === 0)
        const onlyFalse = asArray.filter(([key, value]) => value === '')
        try{
            await db.collection('products').updateOne({_id: new ObjectId(productId)}, {
                $unset: Object.fromEntries(onlyFalse),
                $set: Object.fromEntries(onlyTrue)
            })
        }
        catch(error){
            console.log(error)
            await client.close();
            res.status(500).json('mongodb problem');
            return;
        }
         
        await client.close();
        res.status(200).json('ok');
    }
    else{
        res.status(500).json('Route not valid');
    }
}