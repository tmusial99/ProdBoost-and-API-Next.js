import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
        _id: string, 
        companyId: string,
        name: string,
        companyName: string,
        role: string,
        permissions: Array<string>,
        image_url: string,
        passwordWarning: boolean
    }
  }
}