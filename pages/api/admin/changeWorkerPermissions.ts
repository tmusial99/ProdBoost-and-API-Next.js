import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {permissions, workerId}: {permissions: string[], workerId: string} = req.body;
        if(permissions.length===0 || !workerId.length){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        await db.collection('users').updateOne(
            {_id: new ObjectId(workerId), role: 'Worker'},
            {$set: {permissions: permissions}}
        )

        await client.close();

        res.status(200).json({permissions: permissions, msg: 'ok'});
    }
    else{
        res.status(500).json('Route not valid');
    }
}