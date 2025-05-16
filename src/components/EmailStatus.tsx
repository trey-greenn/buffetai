// src/components/EmailStatus.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/supabase/auth-context';

interface ScheduledEmail {
  id: string;
  user_id: string;
  status: string;
  scheduled_time: string;
  sent_time?: string;
  content_ids?: string[];
  email_content?: string;
}

interface EmailStatusProps {
  limit?: number;
}

const EmailStatus: React.FC<EmailStatusProps> = ({ limit }) => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEmails();
  }, [user]);

  const fetchEmails = async () => {
    if (!user) return;
    
    let query = supabase
      .from('scheduled_emails')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: false });
      
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data } = await query;
    setEmails(data || []);
    setLoading(false);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Newsletter History</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : emails.length === 0 ? (
        <p>No newsletters yet</p>
      ) : (
        <div className="space-y-4">
          {emails.map(email => (
            <div key={email.id} className="border p-4 rounded-md">
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  email.status === 'sent' ? 'bg-green-100 text-green-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {email.status}
                </span>
                <span>{new Date(email.scheduled_time).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 text-sm">
                {email.content_ids?.length || 0} articles
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailStatus;