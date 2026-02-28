import { NewTradeForm } from '@/components/trades/NewTradeForm';
import { Card } from '@/components/ui/Card';

export default function NewTradePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Trade</h1>
      <Card className="p-6">
        <NewTradeForm />
      </Card>
    </div>
  );
}
