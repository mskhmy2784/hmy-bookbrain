export function generateStaticParams() {
    return [];
  }
  
  export default function BookLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }
  