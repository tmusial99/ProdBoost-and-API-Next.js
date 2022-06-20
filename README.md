# ProdBoost
<img width="717" alt="ProdBoost example screen" src="https://user-images.githubusercontent.com/50043764/174663524-d010eee2-4866-4496-84db-ecd1652e48de.png">
<img width="717" alt="Adding order example" src="https://user-images.githubusercontent.com/50043764/174664273-fc5d528d-0524-44f1-bfb5-b4ecfcfd5957.png">

## What is ProdBoost?
ProdBoost is a simple and free ERP (Enterprise resource planning) system for small manufacturing companies. It includes many features such as:
- Server side rendering provided by `Next.js` for better SEO
- Safe user authentication provided by `NextAuth.js`
- Light and dark mode
- Creating workers' accounts with limited and customizable permissions
- Full account customization including changing password, changing company name, setting profile picture with cropping and zooming, deleting all company data
- Creating a list of items in storage based on their classifications ( materials, components, products, packaging )
- Easy search for items using their names or customizable tags
- Generating a printable label with QR code for each item to provide better storage organisation
- Easy item quantity editor
- Possibility to create relations between certain items ( ex. Product with ID 5 is made from Components with ID's 2, 6, 7 and is using Packaging with ID 10 )
- Possibillity to create custom production information for Components and Products provided by `Quill.js` text editor
- Creating orders directly from application or from `POST` API route with refreshable and secret API Key
- Customizable delivery options for orders

## What did creating this project teach me?
- Using [NextAuth.js](https://github.com/nextauthjs/next-auth) for really simple and safe user authentication. I like it very much ❤️
- Using form data to upload files to server and parsing it with [multiparty](https://github.com/pillarjs/multiparty)
- Validating forms and HTTP request body with [yup schema builder](https://github.com/jquense/yup)
- That I should pay attention to prop drilling. I found these amazing and easy to use state management packages like [Jotai](https://github.com/pmndrs/jotai) and [Zustand](https://github.com/pmndrs/zustand) that I'm going to use in the future. Amazing job done by [@pmndrs](https://github.com/pmndrs)
- That I should use [mongoose](https://github.com/Automattic/mongoose) instead of simple and hard to mantain in bigger projects [MongoDB driver](https://github.com/mongodb/node-mongodb-native)

## Used technologies
- TypeScript
- React.js
- Next.js
- Mantine UI
- MongoDB
- AWS S3 Bucket
- A couple of npm packages that you can find [there](https://github.com/tmusial99/ProdBoost-and-API-Next.js/blob/main/package.json).
## Try it out!
App is live on [https://prodboost.vercel.app/](https://prodboost.vercel.app/dashboard).

You can log in with test account credentials:
```
Username: testUser
Password: testUser123!

Please be kind to others. Don't change paasword or delete company data.
```
I highly recommend creating new account to safely test all features. There's no e-mail address required!
