import prisma from "@/lib/prisma"
import RolesClient from "./RolesClient"

export default async function AdminRolesPage() {
  const roles = await prisma.adminRole.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } }
  })

  return (
    <div className="p-8">
      <RolesClient roles={roles} />
    </div>
  )
}
