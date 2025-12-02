"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  selectedDate,
  onSelectDate,
  onClose
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayDate = selectedDate || today;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelectDate(date);
    onClose();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateForDisplay = (date: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = monthNamesShort[date.getMonth()];
    
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      return `Hoy, ${day} ${monthName.toLowerCase()}`;
    }
    
    return `${dayName}, ${day} ${monthName}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[50] bg-black/30 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-4">
        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl animate-slide-up-fade flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
            <h3 className="text-lg font-bold text-gray-900">Seleccionar fecha</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Selected Date Display */}
          {displayDate && (
            <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <p className="text-sm font-semibold text-purple-900">
                {formatDateForDisplay(displayDate)}
              </p>
            </div>
          )}

          {/* Calendar */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="w-10 h-10 rounded-full hover:bg-purple-100 active:bg-purple-200 flex items-center justify-center transition-colors active:scale-95"
                style={{ color: '#7031f8' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="text-lg font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button
                onClick={goToNextMonth}
                className="w-10 h-10 rounded-full hover:bg-purple-100 active:bg-purple-200 flex items-center justify-center transition-colors active:scale-95"
                style={{ color: '#7031f8' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-semibold text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="h-12" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isTodayDay = isToday(day);
                const isSelectedDay = isSelected(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-12 w-12 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                      isSelectedDay
                        ? 'bg-gradient-to-br text-white shadow-lg scale-110'
                        : isTodayDay
                        ? 'bg-purple-100 text-purple-900 font-bold border-2 border-purple-400'
                        : 'text-gray-700 hover:bg-purple-50 hover:border hover:border-purple-200'
                    }`}
                    style={isSelectedDay ? { 
                      background: 'linear-gradient(135deg, #7031f8 0%, #8b5cf6 100%)' 
                    } : {}}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  onSelectDate(today);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold text-sm transition-colors active:scale-95"
              >
                Hoy
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatePickerModal;

