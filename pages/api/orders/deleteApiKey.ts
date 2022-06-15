import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        try{
            await db.collection('companies').updateOne({_id: new ObjectId(session.user.companyId)}, {
                $unset: {apiKey: ''}
            }) 
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