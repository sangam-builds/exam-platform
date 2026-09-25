'use client';

import React from 'react';
import { StudentQuestion } from '@exam-platform/shared-types';

interface AnswerOptionsProps {
  question: StudentQuestion;
  selectedAnswer: string | null;
  textAnswer: string | null;
  onSelectOption: (option: string) => void;
  onTextChange: (text: string) => void;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  selectedAnswer,
  textAnswer,
  onSelectOption,
  onTextChange,
}) => {
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  if (question.type === 'SUBJECTIVE') {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <label
          htmlFor="subjective-answer"
          className="block text-sm font-semibold text-slate-300 mb-3"
        >
          Your Written Response:
        </label>
        <textarea
          id="subjective-answer"
          rows={7}
          value={textAnswer || ''}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type your structured explanation or answer here..."
          className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans text-sm leading-relaxed"
        />
        <div className="mt-2 text-right text-xs text-slate-500">
          {(textAnswer || '').length} characters
        </div>
      </div>
    );
  }

  const options = question.options || [];

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
        Select one option:
      </div>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, idx) => {
          const letter = optionLetters[idx] || `${idx + 1}`;
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectOption(option)}
              className={`group relative flex items-start space-x-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/60 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}
              >
                {letter}
              </div>

              <div
                className={`flex-1 text-sm sm:text-base leading-relaxed ${
                  isSelected ? 'text-slate-100 font-medium' : 'text-slate-300'
                }`}
              >
                {option}
              </div>

              <div className="mt-1 flex-shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-700 bg-slate-950/40'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
