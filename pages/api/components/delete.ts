import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import axios from "../../../lib/axios";
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
        if(!session || !session.user.permissions.includes('components')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const componentFromDb = await db.collection('components').findOne({_id: new ObjectId(componentId)});
        if(!componentFromDb){
            await client.close()
            res.status(404).json('component not found')
            return;
        }
        if(componentFromDb.companyId.toString() !== session.user.companyId){
            await client.close();
            res.status(403).json('unvalid company');
            return;
        }
        if(componentFromDb.image_url){
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `components_images/${(componentFromDb.image_url as string).split('/').pop()}`
            }))

            s3client.destroy();
        }

        await db.collection('components').deleteOne(componentFromDb);
        await client.close();
        res.status(200).json('ok');
    }
    else{
        res.status(500).json('Route not valid');
    }
}