import { handlers } from "@/auth"

const { GET: AuthGET, POST: AuthPOST } = handlers;

export async function GET(req: any, ctx: any) {
  return AuthGET(req, ctx);
}

export async function POST(req: any, ctx: any) {
  return AuthPOST(req, ctx);
}
