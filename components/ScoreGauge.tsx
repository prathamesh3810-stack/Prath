import React from 'react';

interface ScoreGaugeProps {
    score: number;
    maxScore: number;
    label: string;
    color: string;
    isPercentage?: boolean;
    icon?: React.ReactNode;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, maxScore, label, color, isPercentage = false, icon }) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    const getStrokeColor = (p: number) => {
        if (p < 40) return 'text-red-500';
        if (p < 70) return 'text-yellow-400';
        return 'text-green-400';
    };
    
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const displayValue = isPercentage ? `${percentage.toFixed(0)}%` : score.toFixed(1);

    return (
        <div className="flex flex-col items-center group">
            {icon && <div className="h-6 w-6 mb-3 transition-transform group-hover:scale-110 duration-300" style={{ color }}>{icon}</div>}
            <div className="relative w-24 h-24 mb-3">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                    <circle
                        className="text-zinc-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className={getStrokeColor(percentage)}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-xl font-heading font-bold text-white tracking-tight">{displayValue}</span>
                </div>
            </div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">{label}</p>
        </div>
    );
};