import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../../lib/getDatabase";
import s3client from "../../../../lib/s3client";

const imageLinkRegex = new RegExp('https://prodboost.s3.eu-central-1.amazonaws.com/richText_images/.*?.webp','g')

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'DELETE'){
        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()

        const allUsersWithPhotos = await db.collection('users').find({companyId: new ObjectId(session.user.companyId), image_url: {$exists: true}}).toArray();
        const allMaterialsWithPhotos = await db.collection('materials').find({companyId: new ObjectId(session.user.companyId), image_url: {$exists: true}}).toArray();
        const allComponents = await db.collection('components').find({companyId: new ObjectId(session.user.companyId)}).toArray();
        const allProducts = await db.collection('products').find({companyId: new ObjectId(session.user.companyId)}).toArray();
        const allPackingWithPhotos = await db.collection('products').find({companyId: new ObjectId(session.user.companyId), image_url: {$exists: true}}).toArray();
        
        await client.close()
        
        allUsersWithPhotos.forEach(async (user) => {
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `profile_images/${user.image_url.split('/').pop()}`
            }))
        })

        allMaterialsWithPhotos.forEach(async (material) => {
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `materials_images/${material.image_url.split('/').pop()}`
            }))
        })

        allComponents.forEach(async (component) => {
            if(component.image_url){
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `components_images/${component.image_url.split('/').pop()}`
                }))
            }
            const componentRichText: string = component.richTextData;
            const allImagesInRichText = componentRichText.match(imageLinkRegex)

            allImagesInRichText?.forEach(async (link) => {
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `richText_images/${link.split('/').pop()}`
                }))
            })
        })

        allProducts.forEach(async (product) => {
            if(product.image_url){
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `products_images/${product.image_url.split('/').pop()}`
                }))
            }
            const componentRichText: string = product.richTextData;
            const allImagesInRichText = componentRichText.match(imageLinkRegex)

            allImagesInRichText?.forEach(async (link) => {
                await s3client.send(new DeleteObjectCommand({
                    Bucket: 'prodboost',
                    Key: `richText_images/${link.split('/').pop()}`
                }))
            })
        })

        allPackingWithPhotos.forEach(async (packing) => {
            await s3client.send(new DeleteObjectCommand({
                Bucket: 'prodboost',
                Key: `packing_images/${packing.image_url.split('/').pop()}`
            }))
        })

        s3client.destroy()
        res.status(200).json('ok')
    }
    else{
        res.status(500).json('Route not valid');
    }
}