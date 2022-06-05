import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {companyName} = req.body;
        if(!companyName || companyName.length>25 || companyName.length<3){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        await db.collection('companies').updateOne(
            {_id: new ObjectId(session.user.companyId)},
            {$set: {companyName: companyName}}    
        )

        await client.close();

        res.status(200).json('success')
    }
    else{
        res.status(500).json('Route not valid');
    }
}