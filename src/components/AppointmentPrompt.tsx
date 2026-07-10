import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function AppointmentPrompt() {
  const { settings, setNextAppointment } = useUserSettings();
  const [editing, setEditing] = useState(false);
  const [dateValue, setDateValue] = useState('');

  const handleSave = async () => {
    if (!dateValue) return;
    await setNextAppointment(dateValue);
    setEditing(false);
  };

  const handleClear = async () => {
    await setNextAppointment(null);
    setEditing(false);
  };

  if (settings?.next_appointment_at && !editing) {
    const days = daysUntil(settings.next_appointment_at);
    return (
      <div className="flex items-center justify-between gap-3 bg-rose-100/50 border border-rose-200/50 rounded-xl px-4 py-2.5 mb-4 text-sm">
        <div className="flex items-center gap-2 text-rose-600">
          <Calendar className="w-4 h-4 text-rose-400" />
          <span>
            {days > 0
              ? `${days} day${days === 1 ? '' : 's'} until your appointment`
              : days === 0
              ? 'Your appointment is today'
              : 'Appointment date has passed'}
          </span>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-rose-400 hover:text-rose-600">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-rose-100/50 border border-rose-200/50 rounded-xl px-4 py-2.5 mb-4 text-sm">
      <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
      {editing ? (
        <>
          <input
            type="date"
            value={dateValue}
            onChange={e => setDateValue(e.target.value)}
            className="bg-rose-100 border border-rose-200 rounded-lg px-2 py-1 text-rose-800 text-sm"
          />
          <button onClick={handleSave} className="text-rose-500 hover:text-rose-600 text-xs font-semibold">
            Save
          </button>
          {settings?.next_appointment_at && (
            <button onClick={handleClear} className="text-rose-400 hover:text-rose-600 text-xs">
              Clear
            </button>
          )}
          <button onClick={() => setEditing(false)} className="ml-auto text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button onClick={() => setEditing(true)} className="text-rose-400 hover:text-rose-600">
          Add your next appointment date so your Case File is ready in time
        </button>
      )}
    </div>
  );
}
