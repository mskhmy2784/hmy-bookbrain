import NewBookClient from './NewBookClient';

export async function generateStaticParams() {
  return [];
}

export default function NewBookPage() {
  return <NewBookClient />;
}
