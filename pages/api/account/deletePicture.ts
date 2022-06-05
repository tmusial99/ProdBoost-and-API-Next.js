import { DeleteObjectCommand, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import sharp from 'sharp'
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'GET'){
        const session = await getSession({req})
        if(!session){
            res.status(401).json('unauthorized');
            return;
        }
        
        const {client, db} = await getDatabase()
        const user = await db.collection('users').findOne({_id: new ObjectId(session.user._id)})
        if(user?.image_url){
            try{
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `profile_images/${(user?.image_url as string).split('/').pop()}`
                }))
            }
            catch(e){
                await client.close();
                res.status(500).json('s3 bucket error');
                return;
            }
            
        }

        await db.collection('users').updateOne(
            {...user},
            {$unset: {image_url:''}}    
        )

        await client.close();

        // response ? res.status(200).json('success') : res.status(400).json('error');
        res.status(200).json('success')
    }
    else{
        res.status(500).json('Route not valid');
    }
}

