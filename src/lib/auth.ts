import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Only allow authentication against the database.  Fallback
        // environment credentials are no longer supported as this would
        // effectively create a backdoor.  The APP_USERNAME/APP_PASSWORD
        // values should instead be used to seed the initial admin user.
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username as string },
          });
          if (!user) {
            return null;
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isPasswordValid) {
            return null;
          }
          return {
            id: user.id,
            username: user.username,
            name: user.username, // required by NextAuth
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the username and role on the token.  When a user logs in the
      // user object will be defined here.  Cast to a known shape rather than any.
      if (user) {
        const u = user as unknown as { username?: string; role?: string };
        token.username = u.username;
        // Attach role if defined
        if (u.role) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id, username and role on the session object.
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.username = token.username as string;
        const role = (token.role ?? undefined) as string | undefined;
        if (role) {
          // Cast session.user to unknown to assign role
          (session.user as unknown as { role?: string }).role = role;
        }
      }
      return session;
    },
  },
});