import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { supabase } from "@/lib/supabase";

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      tenantId: process.env.AZURE_TENANT_ID,
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      const email =
        profile.email ||
        profile.preferred_username ||
        profile.upn;

      const name = profile.name;

      // restrict to Bennett
      if (!email || !email.endsWith("@bennett.edu.in")) {
        return false;
      }

      // 🔥 SAVE USER TO SUPABASE
      const { error } = await supabase.from("users").upsert({
        email: email,
        name: name,
      });

      if (error) {
        console.log("SUPABASE ERROR:", error);
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };