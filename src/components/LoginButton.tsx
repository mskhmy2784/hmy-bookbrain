'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <Button disabled>読み込み中...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user.displayName || user.email}
        </span>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signInWithGoogle}>
      <LogIn className="mr-2 h-4 w-4" />
      Googleでログイン
    </Button>
  );
}
