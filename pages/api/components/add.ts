import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import { IComponent } from "../../../types/items";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const data: IComponent = req.body;
        if(!data || !data.name || data.quantity as number < 0){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('components')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        let newComponentId;
        try{
            const newestComponent = await db.collection('components').find({companyId: new ObjectId(session.user.companyId)}).sort({componentId: -1}).limit(1).toArray();
            const highestComponentId: number = newestComponent[0]?.componentId;
            newComponentId = highestComponentId ? highestComponentId + 1 : 1;
            await db.collection('components').insertOne({
                ...data,
                componentId: newComponentId,
                companyId: new ObjectId(session.user.companyId),
                createdBy: session.user.name,
                createdAt: Date.now(),
                usedMaterials: [],
                richTextData: ''
            })  
        }
        catch(error){
            await client.close();
            res.status(500).json('mongodb problem');
            return;
        }
         
        await client.close();
        res.status(200).json(newComponentId);
    }
    else{
        res.status(500).json('Route not valid');
    }
}