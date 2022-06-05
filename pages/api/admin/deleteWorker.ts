import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {_id}: {_id:string} = req.body;
        if(!_id || _id.length === 0){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        const worker = await db.collection('users').findOne({_id: new ObjectId(_id)});
        if(worker?.image_url){
            try{
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `profile_images/${(worker?.image_url as string).split('/').pop()}`
                }))
                s3client.destroy()
            }
            catch(e){
                s3client.destroy()
                res.status(404).json('s3 deleting workers photo error');
                return;
            }
            
        }
        const responseFromDb = await db.collection('users').deleteOne({_id: new ObjectId(_id)});
        if(responseFromDb.deletedCount === 0){
            res.status(404).json('worker not found');
            return;
        }
        
        await client.close();

        res.status(200).json('worker deleted');
    }
    else{
        res.status(500).json('Route not valid');
    }
}