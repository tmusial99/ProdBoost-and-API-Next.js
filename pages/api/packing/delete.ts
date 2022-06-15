import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {packingId}: {packingId: string} = req.body;
        if(!packingId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('packing')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const packingFromDb = await db.collection('packing').findOne({_id: new ObjectId(packingId)});
        if(!packingFromDb){
            await client.close()
            res.status(404).json('packing not found')
            return;
        }
        if(packingFromDb.companyId.toString() !== session.user.companyId){
            await client.close();
            res.status(403).json('unvalid company');
            return;
        }
        if(packingFromDb.image_url){
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `packing_images/${(packingFromDb.image_url as string).split('/').pop()}`
            }))

            s3client.destroy();
        }


        await db.collection('packing').deleteOne(packingFromDb);
        await client.close();
        res.status(200).json('ok');
    }
    else{
        res.status(500).json('Route not valid');
    }
}