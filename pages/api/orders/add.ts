import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { InferType } from 'yup';
import getDatabase from '../../../lib/getDatabase';
import { validate } from '../../../middleware/validate';
import { orderApiSchema  } from '../../../schemas/order';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {apiKey} = req.query;
  let userCompany = null;
  const {body}: {body: InferType<typeof orderApiSchema>} = req;

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
      const highestIdOrder = await (await db.collection('orders').find({companyId: userCompany ? userCompany._id : new ObjectId(session?.user.companyId)}).project({_id: 0, orderId: 1}).sort({orderId: -1}).limit(1).toArray()).pop()
      const newOrderId = highestIdOrder ? highestIdOrder.orderId + 1 : 1;

      let totalNetto = 0
      let totalBrutto = 0

      body.basket?.forEach((product) => {
        totalNetto += product.totalNetto
        totalBrutto += product.totalBrutto
      })

      totalNetto += body.delivery.netto
      totalBrutto += body.delivery.brutto

      
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