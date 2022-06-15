import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {data, productId}: {data: string[], productId: string} = req.body;
        if(!data || !productId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('products')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        
        try{
            await db.collection('products').updateOne({_id: new ObjectId(productId)}, {
                $set: {usedComponents: data},
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