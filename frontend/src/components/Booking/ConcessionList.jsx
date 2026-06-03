import React from 'react';
import { Plus, Minus, Popcorn } from 'lucide-react';

export const ConcessionList = ({ concessions = [], selectedConcessions = {}, onQtyChange }) => {
  if (concessions.length === 0) {
    return (
      <div className="py-6 text-center text-zinc-500 font-medium text-sm">
        Hiện tại không có dịch vụ bắp nước nào khả dụng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-dark-border pb-3">
        <Popcorn className="text-brand" size={20} />
        <h3 className="text-lg font-black text-zinc-200">Chọn bắp nước & đồ uống</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {concessions.map((item) => {
          const qty = selectedConcessions[item._id] || 0;

          return (
            <div
              key={item._id}
              className="flex bg-dark-card border border-dark-border hover:border-zinc-800 p-3 rounded-2xl gap-4 items-center justify-between transition-colors shadow-sm"
            >
              {/* Product Thumbnail & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-dark-border">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-zinc-200 truncate">{item.name}</h4>
                  <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                  <span className="text-xs font-black text-brand block mt-1">
                    {item.price.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Quantity Increments */}
              <div className="flex items-center space-x-3 bg-zinc-900 border border-dark-border p-1 rounded-xl shrink-0">
                <button
                  onClick={() => onQtyChange(item._id, qty - 1)}
                  disabled={qty <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center font-black text-sm text-zinc-200">{qty}</span>
                <button
                  onClick={() => onQtyChange(item._id, qty + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConcessionList;
