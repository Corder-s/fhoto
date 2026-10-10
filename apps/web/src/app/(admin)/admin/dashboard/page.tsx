import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ArrowRight 
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

export default function AdminDashboardPage() {
  const PENDING_KYC = [
    {
      id: 'kyc-1',
      name: 'Rajat Kapoor',
      phone: '+91 98112 34567',
      city: 'South Delhi',
      idType: 'Aadhaar Card (Masked)',
      gear: 'Sony A7 IV, 24-70 GM',
      submittedAt: '2 hours ago',
    },
    {
      id: 'kyc-2',
      name: 'Shreya Goswami',
      phone: '+91 97234 56789',
      city: 'Bandra, Mumbai',
      idType: 'Passport (First/Last page)',
      gear: 'Canon R6 II, 70-200 L',
      submittedAt: '4 hours ago',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
          Operations & Moderation Desk
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Review photographer applications, mediate client disputes, and oversee platform integrity.
        </p>
      </div>

      {/* OPERATIONS SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Active Shoots Today</p>
          <p className="text-2xl font-extrabold text-ink-primary">28</p>
          <p className="text-[11px] text-green-600 font-bold">● All on schedule</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Pending KYC</p>
          <p className="text-2xl font-extrabold text-brand">4</p>
          <p className="text-[11px] text-brand font-medium">Awaiting manual check</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Escrow Balance</p>
          <p className="text-2xl font-extrabold text-ink-primary">₹3,42,000</p>
          <p className="text-[11px] text-ink-muted">In platform holding</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase font-bold text-ink-muted">Open Disputes</p>
          <p className="text-2xl font-extrabold text-amber-600">1</p>
          <p className="text-[11px] text-amber-700 font-medium">Under investigation</p>
        </Card>
      </div>

      {/* PENDING KYC VERIFICATION QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            Photographer Identity & KYC Verification Queue
          </h2>
          <span className="text-xs font-bold text-brand">4 Applicants Pending</span>
        </div>

        <div className="space-y-3">
          {PENDING_KYC.map((item) => (
            <Card key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink-primary">{item.name}</h3>
                  <Badge variant="warning" size="sm">
                    Pending Verification
                  </Badge>
                </div>
                <p className="text-xs text-ink-secondary">
                  {item.phone} • {item.city} • ID: <strong>{item.idType}</strong>
                </p>
                <p className="text-xs text-ink-muted">
                  Equipment: {item.gear} • Submitted {item.submittedAt}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                  Inspect Docs
                </Button>
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Approve Pro
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
