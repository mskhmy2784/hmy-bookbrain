import BookDetailClient from './BookDetailClient';

export async function generateStaticParams() {
  return [];
}

export default function BookDetailPage() {
  return <BookDetailClient />;
}
