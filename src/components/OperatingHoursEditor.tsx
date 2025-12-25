import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';

const DAYS = [
  { key: '1', label: 'Luni' },
  { key: '2', label: 'Marți' },
  { key: '3', label: 'Miercuri' },
  { key: '4', label: 'Joi' },
  { key: '5', label: 'Vineri' },
  { key: '6', label: 'Sâmbătă' },
  { key: '0', label: 'Duminică' },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHours {
  [key: string]: DaySchedule;
}

const DEFAULT_HOURS: OperatingHours = {
  '0': { open: '08:00', close: '18:00', closed: true },
  '1': { open: '08:00', close: '18:00', closed: false },
  '2': { open: '08:00', close: '18:00', closed: false },
  '3': { open: '08:00', close: '18:00', closed: false },
  '4': { open: '08:00', close: '18:00', closed: false },
  '5': { open: '08:00', close: '18:00', closed: false },
  '6': { open: '09:00', close: '14:00', closed: false },
};

interface OperatingHoursEditorProps {
  value: OperatingHours | null;
  onChange: (hours: OperatingHours) => void;
}

const OperatingHoursEditor = ({ value, onChange }: OperatingHoursEditorProps) => {
  const [hours, setHours] = useState<OperatingHours>(value || DEFAULT_HOURS);

  useEffect(() => {
    if (value) {
      setHours(value);
    }
  }, [value]);

  const updateDay = (dayKey: string, field: keyof DaySchedule, fieldValue: string | boolean) => {
    const newHours = {
      ...hours,
      [dayKey]: {
        ...hours[dayKey],
        [field]: fieldValue,
      },
    };
    setHours(newHours);
    onChange(newHours);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Program de funcționare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const daySchedule = hours[day.key] || DEFAULT_HOURS[day.key];
          
          return (
            <div
              key={day.key}
              className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b last:border-0"
            >
              <div className="w-24 font-medium">{day.label}</div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={!daySchedule.closed}
                  onCheckedChange={(checked) => updateDay(day.key, 'closed', !checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {daySchedule.closed ? 'Închis' : 'Deschis'}
                </span>
              </div>

              {!daySchedule.closed && (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={daySchedule.open}
                    onValueChange={(val) => updateDay(day.key, 'open', val)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">-</span>
                  
                  <Select
                    value={daySchedule.close}
                    onValueChange={(val) => updateDay(day.key, 'close', val)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default OperatingHoursEditor;
