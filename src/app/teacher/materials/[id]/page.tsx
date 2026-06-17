import { redirect } from 'next/navigation';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/teacher/materials/${id}/edit`);
}
