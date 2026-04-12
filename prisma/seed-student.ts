import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding student mock data...')

  // Create a student if not already present
  let student = await prisma.user.findUnique({ where: { email: 'student@example.com' } })
  if (!student) {
    const hashedPassword = await hash('password123', 10)
    student = await prisma.user.create({
      data: {
        email: 'student@example.com',
        name: 'Alex Student',
        password: hashedPassword,
        role: 'STUDENT',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4UeVjdE9vLCqkj7SyCEGler4aGvlCwdYpmqVp0cDgQN-B09pvN9OrtVWynZmUUxvTVP9mAsgSLWx-Ag5kxfQqqRcSdYN61zxDBeCHI71WSlnCIo6Kxz83OBuTEfG3qVktRHHG_LyuaozLOD4wQOQ54OCfGNgnP2_VH7ocpD6u0Ypc3y0Zu52SVqPW0sW4guBb4C06oiwglwM15Fhah6pGngIrtFVsU47mG1qGAnOMnQZFV6fGI_6uFlo89i4ULCFPitxZrmXH4QS'
      }
    })
  }

  // Create a teacher for the class
  let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } })
  if (!teacher) {
    const hashedPassword = await hash('password123', 10)
    teacher = await prisma.user.create({
      data: {
        email: 'teacher.seed@example.com',
        name: 'Teacher Nam',
        password: hashedPassword,
        role: 'TEACHER'
      }
    })
  }

  // Create a class
  let myClass = await prisma.class.findUnique({ where: { classCode: 'PHYS-9A' } })
  if (!myClass) {
    myClass = await prisma.class.create({
      data: {
        name: 'Physics Honors',
        description: 'Teacher Nam',
        gradeLevel: '9',
        classCode: 'PHYS-9A',
        joinCode: 'PHYS-JOIN-9A',
        teacherId: teacher.id
      }
    })
  }

  // Enroll student
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId: myClass.id } }
  })
  if (!enrollment) {
    await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classId: myClass.id,
        status: 'ACTIVE'
      }
    })
  }

  // Create some assignments
  const assignmentsData = [
    {
      title: 'Comparative Analysis: Victorian Era Literature',
      status: 'PUBLIC',
      materialType: 'EXERCISE',
      teacherId: teacher.id,
      dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
      thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZpFTb6V2i5-ctnRKi99pHGa8_RZKgwygm1KoEYjkRlDW3nra2JdBQ_0U4LlGqoXFbsnl3uXtg5cuWRSOQcs99CHFqPSfk4Oth6dSLVhHF8t0KfK1YLUEpfGAthSz0qAaIa0xGIp5J8JVWaGZShoUB_xnNAqHCZOdiLlVs5rIwCcbv4c6QFFMQYQRqaKxeLwXfD41T9N9fEgIP47cJwjQA6iWzPLHjvB-4jLAwiBv_yLIu9IEzgsOB34IatSx1x6Vs0DMXp2fw3Qia'
    },
    {
      title: 'Genetics: The Blueprint of Life',
      status: 'PUBLIC',
      materialType: 'EXERCISE',
      teacherId: teacher.id,
      dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Advanced Calculus: Integral Theory',
      status: 'PUBLIC',
      materialType: 'EXERCISE',
      teacherId: teacher.id,
      dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)
    }
  ]

  for (const asg of assignmentsData) {
    const existing = await prisma.assignment.findFirst({ where: { title: asg.title } })
    let asgRecord = existing
    // @ts-ignore
    const { dueDate, ...asgCreate } = asg
    
    if (!existing) {
      asgRecord = await prisma.assignment.create({
        // @ts-ignore
        data: asgCreate
      })
    }
    
    if (asgRecord) {
      const assignmentClass = await prisma.assignmentClass.findUnique({
        where: { assignmentId_classId: { assignmentId: asgRecord.id, classId: myClass.id } }
      })
      if (!assignmentClass) {
        await prisma.assignmentClass.create({
          data: {
            assignmentId: asgRecord.id,
            classId: myClass.id,
            dueDate: dueDate
          }
        })
      }
    }
  }

  // Create some past submissions (for completed tasks / high scores)
  const pastSubmissions = [
    { title: 'Biology Lab Report', score: 98, submittedAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000) },
    { title: 'History Quiz', score: 85, submittedAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) },
    { title: 'Math Midterm', score: 92, submittedAt: new Date(new Date().getTime() - 48 * 60 * 60 * 1000) }
  ]

  for (const sub of pastSubmissions) {
    const existingAsg = await prisma.assignment.findFirst({ where: { title: sub.title } })
    
    let aId = existingAsg?.id
    if (!existingAsg) {
      const newAsg = await prisma.assignment.create({
        data: {
          title: sub.title,
          status: 'PUBLIC',
          materialType: 'EXERCISE',
          teacherId: teacher.id,
        }
      })
      aId = newAsg.id
      await prisma.assignmentClass.create({
        data: {
          assignmentId: newAsg.id,
          classId: myClass.id,
        }
      })
    }

    if (aId) {
      const existSub = await prisma.submission.findFirst({
        where: { studentId: student.id, assignmentId: aId }
      })
      if (!existSub) {
        await prisma.submission.create({
          data: {
            studentId: student.id,
            assignmentId: aId,
            score: sub.score,
            submittedAt: sub.submittedAt,
          }
        })
      }
    }
  }

  console.log('Seeding student data completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
