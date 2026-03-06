'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f3] dark:bg-[#111111]">
      <SignIn />
    </div>
  );
}
