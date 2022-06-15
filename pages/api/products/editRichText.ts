import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";
import s3client from "../../../lib/s3client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {data, productId}: {data: string, productId: string} = req.body;
        if(!data || !productId){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || !session.user.permissions.includes('products')){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        
        try{
            const currentProduct = await db.collection('products').findOne({_id: new ObjectId(productId)}, {projection: {_id: 0, richTextData: 1}})
            const currentRichTextData: string = currentProduct?.richTextData;

            const regex = new RegExp('https://prodboost.s3.eu-central-1.amazonaws.com/richText_images/.*?.webp','g')
            const allImagesInCurrent = currentRichTextData.match(regex)
            const allImagesInNew = data.match(regex)
            
            let s3error = false
            allImagesInCurrent?.forEach(async (link) => {
                if(!allImagesInNew?.includes(link)){
                    try{
                        await s3client.send(new DeleteObjectCommand({
                            Bucket: 'prodboost',
                            Key: `richText_images/${link.split('/').pop()}`
                        }))
            
                        s3client.destroy();
                    }
                    catch(e){
                        s3error = true;
                    }
                }
            })
            if(s3error){
                res.status(500).json('s3 bucket error');
                return;
            }

            await db.collection('products').updateOne({_id: new ObjectId(productId)}, {
                $set: {richTextData: data},
            })
        }
        catch(error){
            console.log(error)
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