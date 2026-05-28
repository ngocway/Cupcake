import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }

    const attachments = await prisma.mediaAttachment.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error('Error fetching media attachments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, url, name, type } = body;

    if (!assignmentId || !url || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attachment = await prisma.mediaAttachment.create({
      data: {
        assignmentId,
        url,
        name,
        type: type || 'AUDIO',
      },
    });

    return NextResponse.json(attachment);
  } catch (error: any) {
    console.error('Error creating media attachment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await prisma.mediaAttachment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting media attachment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
