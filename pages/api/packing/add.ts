import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import { IPacking } from "../../../types/items";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const data: IPacking = req.body;
        if(!data || !data.name || data.quantity as number < 0){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('packing')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        let newPackingId;
        try{
            const newestMaterial = await db.collection('packing').find({companyId: new ObjectId(session.user.companyId)}).sort({packingId: -1}).limit(1).toArray();
            const highestPackingId: number = newestMaterial[0]?.packingId;
            newPackingId = highestPackingId ? highestPackingId + 1 : 1;
            await db.collection('packing').insertOne({
                ...data,
                packingId: newPackingId,
                companyId: new ObjectId(session.user.companyId),
                createdBy: session.user.name,
                createdAt: Date.now()
            })  
        }
        catch(error){
            await client.close();
            res.status(500).json('mongodb problem');
            return;
        }
         
        await client.close();
        res.status(200).json(newPackingId);
    }
    else{
        res.status(500).json('Route not valid');
    }
}