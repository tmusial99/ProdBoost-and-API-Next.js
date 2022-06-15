import { DeleteObjectCommand, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import sharp from 'sharp'
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

function getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

export const config = {
    api:{
        bodyParser:{
            sizeLimit: '8mb'
        }
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {base64, componentId}: {base64: string, componentId: string} = req.body;

        if(!base64 || !componentId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session?.user.permissions.includes('components')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const component = await db.collection('components').findOne({_id: new ObjectId(componentId)})
        if(component?.companyId.toString() !== session.user.companyId.toString()){
            await client.close();
            res.status(401).json('unauthorized');
            return;
        }
        const validBase64 = (base64 as string).split(';base64,').pop() as string
        
        const file = await sharp(Buffer.from(validBase64, 'base64'))
            .resize(500, 500)
            .webp()
            .toBuffer()

        const params: PutObjectCommandInput = {
            Bucket: 'prodboost',
            Key: `components_images/${Date.now()}${getRandomInt(100,1000)}.webp`,
            ContentType: 'image/webp',
            Body: file
        }
        const urlToPicture = `https://prodboost.s3.eu-central-1.amazonaws.com/${params.Key}`;
        
        
        if(component?.image_url){
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `components_images/${(component.image_url as string).split('/').pop()}`
            }))
        }

        try{
            await s3client.send(new PutObjectCommand(params));
            s3client.destroy();
        }
        catch(e){
            s3client.destroy()
            await client.close();
            res.status(500).json('s3 bucket error');
            return;
        }
        
        const response = await db.collection('components').updateOne(
            {_id: new ObjectId(componentId)},
            {$set: {image_url: urlToPicture}}    
        )

        await client.close();

        res.status(200).json(urlToPicture)
    }
    else{
        res.status(500).json('Route not valid');
    }
}

