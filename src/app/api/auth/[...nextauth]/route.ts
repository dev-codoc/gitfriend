// This one file handles ALL auth-related routes: /api/auth/signin,
// /api/auth/signout, /api/auth/callback/google, etc. — same idea as
// mounting a whole router at one path in Express, e.g. app.use("/api/auth", authRouter).

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
