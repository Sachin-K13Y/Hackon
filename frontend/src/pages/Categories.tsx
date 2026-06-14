import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2X2 } from 'lucide-react';
import { CATEGORIES } from '../types';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="page-content bg-gray-50">
      <div className="bg-[#232F3E] px-4 py-4 flex items-center gap-2">
        <Grid2X2 size={18} className="text-[#FFD814]" />
        <h1 className="text-white font-bold">All Categories</h1>
      </div>
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/category/${cat.id}`)}
            className="flex flex-col items-center gap-2 bg-white rounded-2xl py-5 px-2 shadow-sm border border-gray-100"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: cat.color + '20' }}
            >
              {cat.icon}
            </div>
            <span className="text-xs text-gray-700 font-semibold text-center leading-tight">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
