import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import getDatabase from '../../../lib/getDatabase';
import { validate } from '../../../middleware/validate';
import { IOrderApiSchema, orderApiSchema } from '../../../schemas/order';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {apiKey} = req.query;
  let userCompany = null;
  const {body}: {body: IOrderApiSchema} = req;

  if(req.method === 'POST'){
    const {client, db} = await getDatabase();
    const session = await getSession({req})

    if((!session || !session.user.permissions.includes('orders')) && !apiKey){
      await client.close()
      return res.status(401).json('unauthorized');
    }
    else if(apiKey){
      userCompany = await db.collection('companies').findOne({apiKey: apiKey});
      if(!userCompany){
        await client.close();
        return res.status(401).json('invalid api key')
      }
    }

    try{
      if(!userCompany) userCompany = await db.collection('companies').findOne({_id: new ObjectId(session?.user.companyId)});
      if(userCompany?.deliveryOptions.filter((delivery: {id: number}) => delivery.id === body.deliveryId).length === 0){
        await client.close();
        return res.status(400).json('delivery not found');
      }

      const highestIdOrder = await (await db.collection('orders').find({companyId: userCompany ? userCompany._id : new ObjectId(session?.user.companyId)}).project({_id: 0, orderId: 1}).sort({orderId: -1}).limit(1).toArray()).pop()
      const newOrderId = highestIdOrder ? highestIdOrder.orderId + 1 : 1;
      const allProducts = await db.collection('products').find({companyId: userCompany?._id}).project({_id: 0, productId: 1, netto: 1, brutto: 1}).toArray()

      let totalNetto = 0
      let totalBrutto = 0
      let errorOnProductId = 0;
      body.basket?.forEach((arr) => {
        const newArr = arr as number[]
        const product = allProducts.filter(product => product.productId === newArr[0]).pop()
        if(!product){
          errorOnProductId = newArr[0];
          return;
        }
        totalNetto += product?.netto * newArr[1];
        totalBrutto += product?.brutto * newArr[1]
      })
      if(errorOnProductId !== 0) return res.status(400).json(`product with id: ${errorOnProductId} not found`)

      totalNetto += userCompany?.deliveryOptions.filter((delivery: {id: number, netto: number, brutto: number}) => delivery.id === body.deliveryId).pop().netto;
      totalBrutto += userCompany?.deliveryOptions.filter((delivery: {id: number, netto: number, brutto: number}) => delivery.id === body.deliveryId).pop().brutto;

      
      await db.collection('orders').insertOne({
        orderId: newOrderId,
        companyId: userCompany ? userCompany._id : new ObjectId(session?.user.companyId),
        status: 1,
        createdAt: Date.now(),
        totalNetto: totalNetto,
        totalBrutto: totalBrutto,
        ...body
      });
      await client.close();
      return res.status(200).json({orderId: newOrderId});
    }
    catch(e){
      await client.close();
      return res.status(500).json('mongodb error');
    }
  }
  else{
    return res.status(500).json('Route not valid')
  }
};

export default validate(orderApiSchema, handler);