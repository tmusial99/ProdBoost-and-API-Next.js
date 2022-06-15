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

        let newApiKey;
        try{
            const company = await db.collection('companies').findOne({_id: new ObjectId(session.user.companyId)})

            do newApiKey = createApiKey(25)
            while(newApiKey === company?.apiKey)
                
            await db.collection('companies').updateOne({_id: new ObjectId(session.user.companyId)}, {
                $set: {apiKey: newApiKey}
            }) 
        }
        catch(error){
            await client.close();
            res.status(500).json('mongodb problem');
            return;
        }
         
        await client.close();
        res.status(200).json(newApiKey);
    }
    else{
        res.status(500).json('Route not valid');
    }
}

function createApiKey(length: number) {
    var apiKey = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++){
        apiKey += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return apiKey;
}