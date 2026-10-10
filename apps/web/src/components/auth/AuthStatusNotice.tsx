import React from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export type AuthNoticeType = 
  | 'pending_verification' 
  | 'suspended' 
  | 'session_expired' 
  | 'unauthorized';

interface AuthStatusNoticeProps {
  type: AuthNoticeType;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export const AuthStatusNotice: React.FC<AuthStatusNoticeProps> = ({
  type,
  title,
  description,
  actionText,
  actionHref = '/login',
}) => {
  const configs = {
    pending_verification: {
      icon: <Clock className="w-8 h-8 text-amber-600" />,
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
      badgeText: 'Application Under Review',
      defaultTitle: 'Creator Verification in Progress',
      defaultDescription:
        'Your photographer documents and portfolio are currently being inspected by our operations team. Verification is typically completed within 24 hours.',
      defaultAction: 'View Verification Status',
      defaultActionHref: '/photographer/verification',
    },
    suspended: {
      icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
      badgeBg: 'bg-red-50 border-red-200 text-red-700',
      badgeText: 'Account Flagged',
      defaultTitle: 'Account Suspended or Disabled',
      defaultDescription:
        'This account has been temporarily suspended due to a policy or terms review. If you believe this is an error, please reach out to customer support.',
      defaultAction: 'Contact Support Desk',
      defaultActionHref: '/customer/support',
    },
    session_expired: {
      icon: <Lock className="w-8 h-8 text-ink-primary" />,
      badgeBg: 'bg-canvas-secondary border-contour-strong text-ink-secondary',
      badgeText: 'Session Terminated',
      defaultTitle: 'Your Session Has Expired',
      defaultDescription:
        'For your security, your authenticated browser session has timed out. Please sign back in with your mobile number to resume.',
      defaultAction: 'Sign In Again',
      defaultActionHref: '/login',
    },
    unauthorized: {
      icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
      badgeBg: 'bg-red-50 border-red-200 text-red-700',
      badgeText: 'Access Denied (403)',
      defaultTitle: 'Administrative Access Restricted',
      defaultDescription:
        'You do not possess the required role permissions to view this workspace. Administrative roles cannot be self-assigned and must be provisioned securely.',
      defaultAction: 'Return to Homepage',
      defaultActionHref: '/',
    },
  };

  const config = configs[type];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 sm:p-10 border-contour-subtle shadow-card space-y-5">
        <div className="w-16 h-16 rounded-full bg-canvas-primary flex items-center justify-center mx-auto border border-contour-subtle">
          {config.icon}
        </div>

        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider">
          <span className={config.badgeBg}>{config.badgeText}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink-primary">
            {title || config.defaultTitle}
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {description || config.defaultDescription}
          </p>
        </div>

        <div className="pt-2">
          <Link href={actionHref || config.defaultActionHref}>
            <Button variant="primary" className="w-full" size="md">
              {actionText || config.defaultAction}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
