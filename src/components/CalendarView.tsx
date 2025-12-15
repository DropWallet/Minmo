import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Entry } from '@db/types';
import { getEntriesByDateRange } from '@db/queries';
import { getAppInstallDate } from '@utils/storage';

interface CalendarViewProps {
  onEntryPress?: (entryId: string) => void;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasEntry: boolean;
  entry: Entry | null;
  isToday: boolean;
}

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate calendar days for a given month
 */
function generateCalendarDays(
  year: number,
  month: number,
  entriesByDate: Map<string, Entry>,
  currentDate: Date
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Get the day of the week for the first day (0 = Sunday, we want Monday = 0)
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0
  
  const days: CalendarDay[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    const date = new Date(year, month, 1 - firstDayOfWeek + i);
    days.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      hasEntry: false,
      entry: null,
      isToday: false,
    });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = entriesByDate.get(dateKey) || null;
    const isToday = 
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getDate() === currentDate.getDate();
    
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      hasEntry: !!entry,
      entry,
      isToday,
    });
  }
  
  // Fill remaining cells to complete the grid (6 rows = 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      hasEntry: false,
      entry: null,
      isToday: false,
    });
  }
  
  return days;
}

/**
 * Generate list of months from start date to current month
 */
function generateMonths(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  // Reverse so current month is first
  return months.reverse();
}

export function CalendarView({ onEntryPress }: CalendarViewProps) {
  const navigation = useNavigation();
  const [entriesByDate, setEntriesByDate] = useState<Map<string, Entry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [installDate, setInstallDate] = useState<Date | null>(null);
  
  const currentDate = useMemo(() => new Date(), []);
  
  // Load install date and entries
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get install date
        const installTimestamp = await getAppInstallDate();
        const install = new Date(installTimestamp);
        setInstallDate(install);
        
        // Calculate date range (install date to today)
        const startDate = new Date(install.getFullYear(), install.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Load entries for the date range
        const entries = await getEntriesByDateRange(startDate, endDate);
        setEntriesByDate(entries);
      } catch (error) {
        console.error('Error loading calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentDate]);
  
  // Generate months to display
  const months = useMemo(() => {
    if (!installDate) return [];
    return generateMonths(installDate, currentDate);
  }, [installDate, currentDate]);
  
  const handleDayPress = (day: CalendarDay) => {
    if (day.hasEntry && day.entry && onEntryPress) {
      onEntryPress(day.entry.id);
    } else if (day.hasEntry && day.entry) {
      // @ts-expect-error - navigation type doesn't include nested stack screens
      navigation.navigate('EntryImageDetail', { entryId: day.entry.id });
    }
  };
  
  if (loading || !installDate) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted dark:text-text-muted-dark">Loading calendar...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4 gap-[9px]">
        {months.map((month) => {
          const year = month.getFullYear();
          const monthNum = month.getMonth();
          const calendarDays = generateCalendarDays(year, monthNum, entriesByDate, currentDate);
          
          return (
            <View key={`${year}-${monthNum}`} className="flex-col items-start w-full gap-[9px] mb-6">
              {/* Month Header */}
              <Text className="text-3xl font-serif-semibold text-text-brand dark:text-text-brand-dark pb-2">
                {MONTH_NAMES[monthNum]}{' '}
                <Text className="text-2xl font-serif-bold text-text-brand dark:text-text-brand-dark">
                  {year}
                </Text>
              </Text>
              
              {/* Calendar Grid */}
              <View className="flex-col items-start self-stretch">
                {/* Day of week headers */}
                <View className="flex-row items-center self-stretch">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <View
                      key={index}
                      className="flex-1 flex-col justify-center items-center h-11 px-[13px]"
                    >
                      <Text className="text-sm font-sans-bold text-center text-text-brand dark:text-text-brand-dark">
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* Calendar days - 6 rows */}
                {Array.from({ length: 6 }).map((_, rowIndex) => {
                  const rowDays = calendarDays.slice(rowIndex * 7, (rowIndex + 1) * 7);
                  return (
                    <View key={rowIndex} className="flex-row items-center self-stretch pb-2">
                      {rowDays.map((day, dayIndex) => {
                        const globalIndex = rowIndex * 7 + dayIndex;
                        const isVisible = day.isCurrentMonth;
                        
                        return (
                          <TouchableOpacity
                            key={globalIndex}
                            onPress={() => handleDayPress(day)}
                            disabled={!day.hasEntry}
                            activeOpacity={day.hasEntry ? 0.7 : 1}
                            className={`flex-1 flex-col items-center h-10 px-[13px] py-0.5 ${
                              !isVisible ? 'opacity-0' : ''
                            }`}
                          >
                            {day.isToday ? (
                              <View className="flex-1 justify-center items-center self-stretch rounded-full bg-teal-300 dark:bg-teal-300">
                                <Text className="text-sm font-sans-semibold text-center text-text-button-primary dark:text-text-button-primary-dark">
                                  {day.dayNumber}
                                </Text>
                              </View>
                            ) : (
                              <View className="flex-1 flex-col items-center">
                                <Text
                                  className={`text-sm font-sans-semibold text-center ${
                                    isVisible
                                      ? 'text-text-primary dark:text-text-primary-dark'
                                      : 'text-transparent'
                                  }`}
                                >
                                  {day.dayNumber}
                                </Text>
                                {day.hasEntry && isVisible && (
                                  <View className="w-3 h-1.5 rounded-full bg-text-brand dark:bg-text-brand-dark mt-0.5" />
                                )}
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

