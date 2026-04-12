"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function registerStudent(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "Vui lòng điền đầy đủ thông tin" }
  }

  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự" }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: "Email này đã được sử dụng" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "STUDENT"
      }
    })

    return { success: "Đăng ký thành công! Đang đăng nhập..." }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Đã xảy ra lỗi trong quá trình đăng ký" }
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string
  
  if (!email) {
    return { error: "Vui lòng nhập email" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success anyway to prevent email enumeration
      return { success: "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi." }
    }

    // In a real application, you would generate a token and send an email here.
    // For now, we'll just mock this functionality.
    console.log(`Password reset requested for ${email}`)

    return { success: "Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi." }
  } catch (error) {
    console.error("Password reset error:", error)
    return { error: "Đã xảy ra lỗi khi yêu cầu đặt lại mật khẩu" }
  }
}
