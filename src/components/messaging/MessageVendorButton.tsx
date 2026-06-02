'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { MessageSquare } from 'lucide-react';

interface MessageVendorButtonProps {
  vendorUserId: string;
  vendorName?: string;
  className?: string;
}

export function MessageVendorButton({ vendorUserId, vendorName, className }: MessageVendorButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageClick = () => {
    // Check if user is logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Prevent self-messaging
    if (user.id === vendorUserId) {
      alert('You cannot message yourself');
      return;
    }

    // Navigate to messages with ?with= parameter
    setIsLoading(true);
    router.push(`/messages?with=${vendorUserId}`);
  };

  return (
    <Button
      onClick={handleMessageClick}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className || ''}`}
      variant="outline"
    >
      <MessageSquare className="h-4 w-4" />
      Message {vendorName || 'Vendor'}
    </Button>
  );
}
