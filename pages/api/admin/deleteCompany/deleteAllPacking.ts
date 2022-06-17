import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'DELETE'){
        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        await db.collection('packing').deleteMany({companyId: new ObjectId(session.user.companyId)})
        await client.close()
        
        res.status(200).json('ok')
    }
    else{
        res.status(500).json('Route not valid');
    }
}