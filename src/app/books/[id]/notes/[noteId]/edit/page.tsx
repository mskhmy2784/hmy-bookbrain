import EditNoteClient from './EditNoteClient';

export async function generateStaticParams() {
  return [];
}

export default function EditNotePage() {
  return <EditNoteClient />;
}
