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
        if(!session?.user.permissions.includes('packing')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const packing = await db.collection('packing').findOne({_id: new ObjectId(packingId)})
        if(packing?.companyId.toString() !== session.user.companyId.toString()){
            await client.close();
            res.status(401).json('unauthorized');
            return;
        }

        if(packing?.image_url){
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `packing_images/${(packing.image_url as string).split('/').pop()}`
            }))

            s3client.destroy();

            try{
                await db.collection('packing').updateOne(packing, {
                    $unset: {image_url: ''}
                })

                await client.close();
                res.status(200).json('ok')
            }
            catch(e){
                await client.close()
                res.status(500).json('mongodb problem')
                return;
            }
        }
        else{
            res.status(404).json('image not found')
        }
    }
    else{
        res.status(500).json('Route not valid');
    }
}