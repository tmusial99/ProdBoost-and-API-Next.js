import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {componentId}: {componentId: string} = req.body;
        if(!componentId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('materials')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const materialFromDb = await db.collection('materials').findOne({_id: new ObjectId(componentId)});
        if(!materialFromDb){
            await client.close()
            res.status(404).json('material not found')
            return;
        }
        if(materialFromDb.companyId.toString() !== session.user.companyId){
            await client.close();
            res.status(403).json('unvalid company');
            return;
        }
        if(materialFromDb.image_url){
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `materials_images/${(materialFromDb.image_url as string).split('/').pop()}`
            }))

            s3client.destroy();
        }


        await db.collection('materials').deleteOne(materialFromDb);
        await client.close();
        res.status(200).json('ok');
    }
    else{
        res.status(500).json('Route not valid');
    }
}