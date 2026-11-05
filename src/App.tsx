import React, {useState, useEffect} from 'react';
import {format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths} from 'date-fns';
import {ChevronLeft, ChevronRight, Target} from 'lucide-react';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import {PWAInstallButton} from './PWAInstallButton';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DailyLog = {
  weight?: string;
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  exercise?: string;
};

type Logs = Record<string, DailyLog>;

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [logs, setLogs] = useState<Logs>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingLog, setEditingLog] = useState<DailyLog>({});
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const savedLogs = localStorage.getItem('healthLogs');
    const savedTarget = localStorage.getItem('targetWeight');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedTarget) setTargetWeight(savedTarget);
  }, []);

  useEffect(() => {
    localStorage.setItem('healthLogs', JSON.stringify(logs));
    localStorage.setItem('targetWeight', targetWeight);
  }, [logs, targetWeight]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const handleSave = () => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setLogs({...logs, [dateKey]: editingLog});
      setSelectedDate(null);
      setEditingLog({});
    }
  };

  const getWeightData = () => {
    return Object.entries(logs)
      .filter(([_, log]) => log.weight)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, log]) => ({ date: format(new Date(date), 'MM/dd'), weight: parseFloat(log.weight!) }));
  };

  const getExerciseData = () => {
    return Object.entries(logs)
      .filter(([_, log]) => log.exercise)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, log]) => ({ date: format(new Date(date), 'MM/dd'), exercise: parseFloat(log.exercise!) || 1 }));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <header className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Health Tracker</h1>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button onClick={() => setShowStats(!showStats)} className="p-2 bg-gray-100 rounded-lg text-sm font-medium">
              {showStats ? 'Calendar' : 'Stats'}
            </button>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
              <input
                type="number"
                placeholder="Target Weight"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-20 bg-transparent outline-none text-right"
              />
            </div>
          </div>
        </div>
        {!showStats && (
          <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></button>
            <h2 className="text-xl font-semibold">{format(currentDate, 'yyyy.MM')}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></button>
          </div>
        )}
      </header>

      {showStats ? (
        <div className="max-w-md mx-auto space-y-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Weight Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getWeightData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Exercise Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getExerciseData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="exercise" stroke="#9333ea" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto grid grid-cols-7 gap-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-gray-400 text-sm">{day}</div>
          ))}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const log = logs[dateKey];
            return (
              <button
                key={dateKey}
                onClick={() => {
                  setSelectedDate(day);
                  setEditingLog(log || {});
                }}
                className={cn(
                  "h-20 rounded-lg p-1 text-left text-xs border border-gray-200 flex flex-col gap-1",
                  log ? "bg-gray-50" : "bg-white"
                )}
              >
                <span className="font-semibold">{format(day, 'd')}</span>
                {log?.weight && <div className="text-[10px] text-blue-600 truncate">W: {log.weight}</div>}
              </button>
            );
          })}
        </div>
      )}



      {selectedDate && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm flex flex-col gap-4 border border-gray-200">
            <h3 className="text-lg font-semibold">{format(selectedDate, 'yyyy.MM.dd')}</h3>
            <input placeholder="Weight (kg)" type="number" value={editingLog.weight || ''} onChange={e => setEditingLog({...editingLog, weight: e.target.value})} className="bg-gray-100 p-2 rounded" />
            <div className="flex flex-col gap-2">
              <input placeholder="Breakfast" value={editingLog.meals?.breakfast || ''} onChange={e => setEditingLog({...editingLog, meals: {...editingLog.meals, breakfast: e.target.value}})} className="bg-gray-100 p-2 rounded" />
              <input placeholder="Lunch" value={editingLog.meals?.lunch || ''} onChange={e => setEditingLog({...editingLog, meals: {...editingLog.meals, lunch: e.target.value}})} className="bg-gray-100 p-2 rounded" />
              <input placeholder="Dinner" value={editingLog.meals?.dinner || ''} onChange={e => setEditingLog({...editingLog, meals: {...editingLog.meals, dinner: e.target.value}})} className="bg-gray-100 p-2 rounded" />
            </div>
            <input placeholder="Exercise" value={editingLog.exercise || ''} onChange={e => setEditingLog({...editingLog, exercise: e.target.value})} className="bg-gray-100 p-2 rounded" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelectedDate(null)} className="flex-1 bg-gray-200 p-2 rounded">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white p-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
