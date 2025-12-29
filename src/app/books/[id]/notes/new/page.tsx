import NewNoteClient from './NewNoteClient';

export async function generateStaticParams() {
  return [];
}

export default function NewNotePage() {
  return <NewNoteClient />;
}
