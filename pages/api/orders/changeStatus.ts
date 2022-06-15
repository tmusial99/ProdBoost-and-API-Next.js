import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'PUT'){
        const {_id, status}: {_id: string, status: number} = req.body
        if(!_id || _id.length === 0){
            return res.status(400).json('_id required')
        }
        if(!status || typeof status !== 'number' || status > 6 || status < 1){
            return res.status(400).json('status invalid')
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('orders')){
            return res.status(401).json('unauthorized');
        }

        const {client, db} = await getDatabase()
        try{
            const response = await db.collection('orders').updateOne({_id: new ObjectId(_id), companyId: new ObjectId(session.user.companyId)}, {$set: {status: status}})
            if(response.modifiedCount === 0){
                await client.close();
                return res.status(400).json('_id invalid')
            }
        }
        catch(error){
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