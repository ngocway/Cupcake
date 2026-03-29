import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    // Explicitly extract fields instead of passing formData to prevent Next 15 context loss
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await signIn("credentials", { 
      email, 
      password,
      redirectTo: "/" 
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Tài khoản hoặc mật khẩu không chính xác."
        default:
          return "Đã xảy ra sự cố trong quá trình đăng nhập."
      }
    }
    throw error;
  }
}
