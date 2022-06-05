import NextAuth from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from 'bcryptjs';
import getDatabase from '../../../lib/getDatabase';
import { ObjectId } from 'mongodb';

const createOptions = (req) => ({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {},
            async authorize(credentials){
                const {client, db} = await getDatabase()
                const user = await db.collection('users').findOne({username: credentials.username})
                if(!user){
                    client.close();
                    throw new Error('Invalid username or password');
                }

                if(user.hashedPassword){
                    const isValid = await compare(credentials.password, user.hashedPassword);
                    if(!isValid){
                        client.close();
                        throw new Error('Invalid username or password');
                    }
                }

                if(user.initialPassword){
                    const isValid = credentials.password === user.initialPassword;
                    if(!isValid){
                        client.close();
                        throw new Error('Invalid username or password');
                    }
                }

                const company = await db.collection('companies').findOne({_id: ObjectId(user.companyId)})

                await client.close();
                return {
                    _id: user._id, 
                    companyId: user.companyId,
                    name: `${user.firstName} ${user.surname}`,
                    companyName: company?.companyName,
                    role: user.role,
                    permissions: user.permissions,
                    image_url: user.image_url,
                    passwordWarning: user.passwordWarning
                }
            }
        }),
    ],
    callbacks:{
        async jwt({token, user}){
            if(user){
                token.user = user;
            }
            if(req.query.update){
            // req.url === `${process.env.NEXTAUTH_URL}/api/auth/session?update` ||
            // req.url === '/api/auth/session?update'
                const {client, db} = await getDatabase();
                const newUserData = await db.collection('users').findOne({_id: ObjectId(token.user._id)})
                const newCompanyData = await db.collection('companies').findOne({_id: ObjectId(newUserData.companyId)})
                await client.close();

                token.user = {
                    _id: newUserData._id, 
                    companyId: newUserData.companyId,
                    name: `${newUserData.firstName} ${newUserData.surname}`,
                    companyName: newCompanyData?.companyName,
                    role: newUserData.role,
                    permissions: newUserData.permissions,
                    image_url: newUserData.image_url,
                    passwordWarning: newUserData.passwordWarning
                }
            }
            return token;
        },
        async session({session, token}){
            session.user = token.user;
            return session;
        }
    }
});

export default async (req, res) => {
    return NextAuth(req, res, createOptions(req));
};
